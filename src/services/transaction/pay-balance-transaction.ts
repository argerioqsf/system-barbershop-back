import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { CashRegisterRepository } from '@/repositories/cash-register-repository'
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

interface PayBalanceTransactionRequest {
  userId: string
  affectedUserId: string
  description?: string
  amount?: number
  saleItemIds?: string[]
  appointmentServiceIds?: string[]
  receiptUrl?: string | null
  discountLoans?: boolean
}

interface PayBalanceTransactionResponse {
  transactions: Transaction[]
}
type TypeForPayment = 'forAmmount' | 'ForListIds'

export class PayBalanceTransactionService {
  constructor(
    private barberUserRepository: BarberUsersRepository,
    private cashRegisterRepository: CashRegisterRepository,
    private saleItemRepository: SaleItemRepository,
    private payUserCommissionService: PayUserCommissionService,
    private payLoansService: PayUserLoansService,
    private updateCashRegisterFinalAmountService: UpdateCashRegisterFinalAmountService,
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

  private typeForPaymentHandler(
    data: PayBalanceTransactionRequest,
  ): TypeForPayment {
    const typeForPayment = data.amount
      ? 'forAmmount'
      : data.saleItemIds || data.appointmentServiceIds
      ? 'ForListIds'
      : null
    if (typeForPayment === null) {
      throw new Error(
        'It is mandatory to pass at least one of the fields amount, saleItemIds, appointment ServiceIds',
      )
    }
    return typeForPayment
  }

  private async getCommissionToPaidByPaymentLogic(
    typeForPayment: TypeForPayment,
    data: PayBalanceTransactionRequest,
    affectedUserId: string,
  ): Promise<{ commissionToBePaid: number; itemsToBePaid: PaymentItems[] }> {
    if (typeForPayment === 'forAmmount') {
      return { commissionToBePaid: round(data.amount ?? 0), itemsToBePaid: [] }
    } else if (typeForPayment === 'ForListIds') {
      const itemsToBePaid =
        await this.saleItemRepository.findManyPendingCommissionForIds(
          affectedUserId,
          data.appointmentServiceIds,
          data.saleItemIds,
        )
      const resultCalculateCommissionsForItems =
        calculateCommissionsForItems(itemsToBePaid)
      return {
        commissionToBePaid: round(
          resultCalculateCommissionsForItems.totalCommission,
        ),
        itemsToBePaid:
          resultCalculateCommissionsForItems.allUserUnpaidSalesItemsFormatted,
      }
    } else {
      throw new Error(
        'It is mandatory to pass at least one of the fields amount, saleItemIds, appointment ServiceIds',
      )
    }
  }

  async execute(
    data: PayBalanceTransactionRequest,
    userToken: UserToken,
  ): Promise<PayBalanceTransactionResponse> {
    logger.debug(PayBalanceTransactionService.name)
    const session = await this.cashRegisterRepository.findOpenByUnit(
      userToken.unitId,
    )
    if (!session) throw new CashRegisterClosedError()
    const affectedUser = await this.barberUserRepository.findById(
      data.affectedUserId,
    )
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

    // pega qual o tipo de pagamento ta sendo feito forAmmount ou ForListIds
    const paymentLogic = this.typeForPaymentHandler(data)

    // retorna o valor que foi solicitado a pagar de acordo com a logica de pagamento
    const { commissionToBePaid, itemsToBePaid } =
      await this.getCommissionToPaidByPaymentLogic(
        paymentLogic,
        data,
        affectedUser.id,
      )

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

      if (paymentLogic === 'ForListIds') {
        logger.debug('payment will be made by items', {
          itemsToBePaidIds: itemsToBePaid.map((item) => ({
            saleItemId: item.saleItemId,
            amount: item.amount,
          })),
        })
        const { transactions: transactionsPayUser } =
          await this.payUserCommissionService.execute(
            {
              userId: affectedUser.id,
              description: data.description,
              allUserUnpaidSalesItemsFormatted,
              itemsToBePaid,
            },
            tx,
          )
        txs.push(...transactionsPayUser)
      } else {
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
      }

      logger.debug('updated cash with the value', {
        value: -commissionToBePaid,
      })
      await this.updateCashRegisterFinalAmountService.execute(
        { sessionId: session.id, amount: -commissionToBePaid },
        tx,
      )

      return txs
    })

    return { transactions }
  }
}
