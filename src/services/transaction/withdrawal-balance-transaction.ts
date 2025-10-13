import {
  BarberUsersRepository,
  UserFindById,
} from '@/repositories/barber-users-repository'
import {
  CashRegisterRepository,
  ResponseFindOpenByUnit,
} from '@/repositories/cash-register-repository'
import { SaleItemRepository } from '@/repositories/sale-item-repository'
import { PayUserLoansService } from '../loan/pay-user-loans'
import { Transaction } from '@prisma/client'
import { CashRegisterClosedError } from '@/services/@errors/cash-register/cash-register-closed-error'
import { AffectedUserNotFoundError } from '@/services/@errors/transaction/affected-user-not-found-error'
import { InsufficientBalanceError } from '@/services/@errors/transaction/insufficient-balance-error'
import { PayUserCommissionService } from './pay-user-comission'
import {
  calculateCommissionsForItems,
  PaymentItems,
} from '../users/utils/calculatePendingCommissions'
import { UserToken } from '@/http/controllers/authenticate-controller'
import { AmountsUserInconsistentError } from '../@errors/user/amounts-user-inconsistent'
import { UpdateCashRegisterFinalAmountService } from '../cash-register/update-cash-register-final-amount'
import { logger } from '@/lib/logger'
import { round, toCents } from '@/utils/format-currency'
import { prisma } from '@/lib/prisma'
import { NegativeValuesNotAllowedError } from '../@errors/transaction/negative-values-not-allowed-error'
import { UnitRepository } from '@/repositories/unit-repository'
import { UnitNotFoundError } from '../@errors/unit/unit-not-found-error'
import { IncrementBalanceUnitService } from '../unit/increment-balance'
import { UserNotFromUnitError } from '../@errors/user/user-not-from-unir-error'

interface PayBalanceTransactionRequest {
  userId: string
  affectedUserId?: string
  description?: string
  amount?: number
  receiptUrl?: string | null
  discountLoans?: boolean
}

interface PayBalanceTransactionResponse {
  transactions: Transaction[]
}
export class WithdrawalBalanceTransactionService {
  constructor(
    private barberUserRepository: BarberUsersRepository,
    private cashRegisterRepository: CashRegisterRepository,
    private saleItemRepository: SaleItemRepository,
    private payUserCommissionService: PayUserCommissionService,
    private payLoansService: PayUserLoansService,
    private updateCashRegisterFinalAmountService: UpdateCashRegisterFinalAmountService,
    private unitRepository: UnitRepository,
    private decrementBalance: IncrementBalanceUnitService,
  ) {}

  private async totalCommissionCalculatorForUser(
    affectedUserId: string,
  ): Promise<{
    totalUserCommission: number
    allUserUnpaidSalesItemsFormatted: PaymentItems[]
  }> {
    const allSaleItemsPending =
      await this.saleItemRepository.findManyPendingCommission(affectedUserId)
    const resultCalculateCommission =
      calculateCommissionsForItems(allSaleItemsPending)
    return {
      totalUserCommission: resultCalculateCommission.totalCommission,
      allUserUnpaidSalesItemsFormatted:
        resultCalculateCommission.allUserUnpaidSalesItemsFormatted,
    }
  }

  private async unitWithdrawal(
    unitId: string,
    userId: string,
    session: ResponseFindOpenByUnit,
    data: PayBalanceTransactionRequest,
  ): Promise<Transaction[]> {
    if (!session) throw new CashRegisterClosedError()

    const unitAffected = await this.unitRepository.findById(unitId)
    if (!unitAffected) throw new UnitNotFoundError()

    const balanceAffectedUnit = round(unitAffected.totalBalance)
    if (balanceAffectedUnit === undefined) {
      throw new Error('Balance unit not found')
    }
    const valueToWithdrawn = round(data.amount ?? 0)

    logger.debug(
      'checks that the amount to be paid is not greater than the unit balance',
      { valueToWithdrawn, balanceAffectedUnit },
    )

    if (toCents(valueToWithdrawn) > toCents(balanceAffectedUnit)) {
      throw new InsufficientBalanceError()
    }

    const transaction = await prisma.$transaction(async (tx) => {
      const txs = await this.decrementBalance.execute(
        unitId,
        userId,
        -valueToWithdrawn,
        undefined,
        undefined,
        undefined,
        data.description,
        tx,
      )
      logger.debug('updated cash with the value', {
        value: -valueToWithdrawn,
      })
      await this.updateCashRegisterFinalAmountService.execute(
        { sessionId: session.id, amount: -valueToWithdrawn },
        tx,
      )
      return txs.transaction
    })

    return [transaction]
  }

  private async userWithdrawal(
    affectedUser: UserFindById,
    session: ResponseFindOpenByUnit,
    data: PayBalanceTransactionRequest,
  ) {
    if (!session) throw new CashRegisterClosedError()
    if (!affectedUser) throw new AffectedUserNotFoundError()

    logger.debug('total balance of the affected user', {
      totalBalance: affectedUser.profile?.totalBalance,
    })

    const balanceAffectedUser = round(affectedUser.profile?.totalBalance ?? 0)
    if (balanceAffectedUser === undefined) {
      throw new Error('Balance user not found')
    }
    const discountLoans = data.discountLoans

    // pega o valor total de comissao que o user tem disponivel
    const { totalUserCommission, allUserUnpaidSalesItemsFormatted } =
      await this.totalCommissionCalculatorForUser(affectedUser.id)

    // pega o valor que foi solicitado a pagar de acordo com a logica de pagamento
    const commissionToBePaid = round(data.amount ?? 0)

    logger.debug('checks the consistency of the commission calculation', {
      totalUserCommission,
      balanceAffectedUser,
    })

    if (toCents(totalUserCommission) !== toCents(balanceAffectedUser)) {
      throw new AmountsUserInconsistentError()
    }

    logger.debug(
      'checks that the amount to be paid is not greater than the users balance',
      { commissionToBePaid, balanceAffectedUser },
    )

    if (toCents(commissionToBePaid) > toCents(balanceAffectedUser)) {
      throw new InsufficientBalanceError()
    }

    if (toCents(commissionToBePaid) < 0) {
      throw new NegativeValuesNotAllowedError()
    }

    const transactions = await prisma.$transaction(async (tx) => {
      const txs: Transaction[] = []

      if (discountLoans) {
        const { transactions: transactionsLoan } =
          await this.payLoansService.execute(
            {
              affectedUser,
              amount: commissionToBePaid,
            },
            tx,
          )

        txs.push(...transactionsLoan)
      }

      logger.debug('payment will be made for a fixed amount', {
        commissionToBePaid,
      })
      const { transactions: transactionsPayUser } =
        await this.payUserCommissionService.execute(
          {
            commissionToBePaid,
            userId: affectedUser.id,
            description: data.description,
            allUserUnpaidSalesItemsFormatted,
          },
          tx,
        )
      txs.push(...transactionsPayUser)

      logger.debug('updated cash with the value', {
        value: -commissionToBePaid,
      })
      await this.updateCashRegisterFinalAmountService.execute(
        { sessionId: session.id, amount: -commissionToBePaid },
        tx,
      )

      return txs
    })

    return transactions
  }

  async execute(
    data: PayBalanceTransactionRequest,
    userToken: UserToken,
  ): Promise<PayBalanceTransactionResponse> {
    logger.debug(WithdrawalBalanceTransactionService.name)

    const session = await this.cashRegisterRepository.findOpenByUnit(
      userToken.unitId,
    )

    const receiptUrl = data.receiptUrl
    logger.debug('receiptUrl', { receiptUrl })

    if (data?.amount && data?.amount < 0) {
      throw new Error('Negative values not allowed')
    }
    if (data.affectedUserId) {
      // retirada de um usuário
      const affectedUser = await this.barberUserRepository.findById(
        data.affectedUserId,
      )
      if (affectedUser?.unitId !== userToken.unitId) {
        throw new UserNotFromUnitError()
      }
      const transactions = await this.userWithdrawal(
        affectedUser,
        session,
        data,
      )
      return { transactions }
    } else {
      // retirada de uma unidade
      const transactions = await this.unitWithdrawal(
        userToken.unitId,
        userToken.sub,
        session,
        data,
      )
      return { transactions }
    }
  }
}
