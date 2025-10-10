import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { CashRegisterRepository } from '@/repositories/cash-register-repository'
import {
  DetailedSaleItemFindMany,
  SaleItemRepository,
} from '@/repositories/sale-item-repository'
import { PayUserLoansService } from '../loan/pay-user-loans'
import { PaymentStatus, Transaction } from '@prisma/client'
import { CashRegisterClosedError } from '@/services/@errors/cash-register/cash-register-closed-error'
import { AffectedUserNotFoundError } from '@/services/@errors/transaction/affected-user-not-found-error'
import { InsufficientBalanceError } from '@/services/@errors/transaction/insufficient-balance-error'
import { PayUserCommissionService } from './pay-user-comission'
import {
  calculateCommissions,
  CalculateCommissionsReturn,
  PaymentItems,
} from '../users/utils/calculatePendingCommissions'
import { UserToken } from '@/http/controllers/authenticate-controller'
import { AmountsUserInconsistentError } from '../@errors/user/amounts-user-inconsistent'
import { UpdateCashRegisterFinalAmountService } from '../cash-register/update-cash-register-final-amount'
import { logger } from '@/lib/logger'
import { round, toCents } from '@/utils/format-currency'
import { prisma } from '@/lib/prisma'

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

  private async calculateCommissionsForIdsHandler(
    affectedUserId: string,
    saleItemIds: string[],
    appointmentServiceIds: string[],
  ): Promise<{
    saleItemsForIds: DetailedSaleItemFindMany[]
    valuesCalculateCommissions: CalculateCommissionsReturn
  }> {
    const saleItemsForIds: DetailedSaleItemFindMany[] =
      await this.saleItemRepository.findManyFilterAppointmentService(
        {
          barberId: affectedUserId,
          sale: { paymentStatus: PaymentStatus.PAID },
          commissionPaid: false,
          OR: [
            {
              AND: [{ id: { in: saleItemIds } }, { serviceId: { not: null } }],
            },
            {
              AND: [{ id: { in: saleItemIds } }, { productId: { not: null } }],
            },
            {
              AND: [
                { appointmentId: { not: null } },
                {
                  appointment: {
                    services: {
                      some: { id: { in: appointmentServiceIds } },
                    },
                  },
                },
              ],
            },
          ],
        },
        appointmentServiceIds,
      )
    return {
      saleItemsForIds,
      valuesCalculateCommissions: calculateCommissions(saleItemsForIds),
    }
  }

  private async calculateCommissionsHandler(affectedUserId: string): Promise<{
    saleItems: DetailedSaleItemFindMany[]
    valuesCalculateCommissions: CalculateCommissionsReturn
  }> {
    const saleItems = await this.saleItemRepository.findMany({
      barberId: affectedUserId,
      sale: { paymentStatus: PaymentStatus.PAID },
      commissionPaid: false,
      OR: [
        { appointmentId: { not: null } },
        { serviceId: { not: null } },
        { productId: { not: null } },
      ],
    })

    return {
      saleItems,
      valuesCalculateCommissions: calculateCommissions(saleItems),
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

  private async getPayValueForTypeForPayment(
    typeForPayment: TypeForPayment,
    data: PayBalanceTransactionRequest,
    affectedUserId: string,
  ) {
    let payValue = 0
    if (typeForPayment === 'forAmmount') {
      payValue = round(data.amount ?? 0)
    } else if (typeForPayment === 'ForListIds') {
      const {
        valuesCalculateCommissions: { totalCommission },
      } = await this.calculateCommissionsForIdsHandler(
        affectedUserId,
        data.saleItemIds ?? [],
        data.appointmentServiceIds ?? [],
      )
      payValue = round(totalCommission)
    } else {
      throw new Error(
        'It is mandatory to pass at least one of the fields amount, saleItemIds, appointment ServiceIds',
      )
    }
    return payValue
  }

  private async getValuesForPay(
    typeForPayment: TypeForPayment,
    affectedUserId: string,
    payValue: number,
    saleItemIds?: string[],
    appointmentServiceIds?: string[],
  ): Promise<{
    paymentItems: PaymentItems[]
    totalToPay: number
  }> {
    if (typeForPayment === 'ForListIds') {
      const {
        valuesCalculateCommissions: { totalCommission, saleItemsRecords },
      } = await this.calculateCommissionsForIdsHandler(
        affectedUserId,
        saleItemIds ?? [],
        appointmentServiceIds ?? [],
      )
      return { paymentItems: saleItemsRecords, totalToPay: totalCommission }
    } else {
      const {
        valuesCalculateCommissions: { saleItemsRecords },
      } = await this.calculateCommissionsHandler(affectedUserId)
      return { paymentItems: saleItemsRecords, totalToPay: payValue }
    }
  }

  async execute(
    data: PayBalanceTransactionRequest,
    userToken: UserToken,
  ): Promise<PayBalanceTransactionResponse> {
    const session = await this.cashRegisterRepository.findOpenByUnit(
      userToken.unitId,
    )
    if (!session) throw new CashRegisterClosedError()
    const affectedUser = await this.barberUserRepository.findById(
      data.affectedUserId,
    )
    if (!affectedUser) throw new AffectedUserNotFoundError()
    logger.debug('affectedUser totalBalance', {
      totalBalance: affectedUser.profile?.totalBalance,
    })
    const balanceAffectedUser = round(affectedUser.profile?.totalBalance ?? 0)
    if (balanceAffectedUser === undefined) {
      throw new Error('Balance user not found')
    }

    const {
      valuesCalculateCommissions: { totalCommission, saleItemsRecords },
    } = await this.calculateCommissionsHandler(affectedUser.id)

    logger.debug('PayBalanceTransactionService data', { data })
    const typeForPayment = this.typeForPaymentHandler(data)
    const payValue: number = await this.getPayValueForTypeForPayment(
      typeForPayment,
      data,
      affectedUser.id,
    )

    if (toCents(totalCommission) !== toCents(balanceAffectedUser)) {
      logger.debug('totalCommission', { totalCommission })
      logger.debug('balanceAffectedUser', { balanceAffectedUser })
      throw new AmountsUserInconsistentError()
    }

    logger.debug('payValue', { payValue })
    logger.debug('balanceAffectedUser', {
      balanceAffectedUser,
    })

    if (toCents(payValue) > toCents(balanceAffectedUser)) {
      throw new InsufficientBalanceError()
    }

    const transactions = await prisma.$transaction(async (tx) => {
      const txs: Transaction[] = []
      let remainingPayValue = payValue

      if (data.discountLoans) {
        const {
          transactions: transactionsLoan,
          remaining: remainingAfterLoan,
          totalPaid: totalPaidLoan,
        } = await this.payLoansService.execute(
          {
            affectedUser,
            amount: remainingPayValue,
          },
          tx,
        )

        if (totalPaidLoan > 0) {
          const { transactions: transactionsPayUserCommission } =
            await this.payUserCommissionService.execute(
              {
                valueToPay: totalPaidLoan,
                affectedUser,
                description: 'Payment Loan',
                totalToPay: totalCommission,
                paymentItems: [...saleItemsRecords],
              },
              tx,
            )
          txs.push(...transactionsPayUserCommission)
        }

        txs.push(...transactionsLoan)
        remainingPayValue = remainingAfterLoan
      }

      if (remainingPayValue > 0) {
        const { paymentItems, totalToPay } = await this.getValuesForPay(
          typeForPayment,
          affectedUser.id,
          remainingPayValue,
          data.saleItemIds,
          data.appointmentServiceIds,
        )

        logger.debug('totalToPay', { totalToPay })

        const { transactions: transactionsPayUser } =
          await this.payUserCommissionService.execute(
            {
              valueToPay: remainingPayValue,
              affectedUser,
              description: data.description,
              totalToPay,
              paymentItems,
            },
            tx,
          )
        txs.push(...transactionsPayUser)
      }

      await this.updateCashRegisterFinalAmountService.execute(
        { sessionId: session.id, amount: -payValue },
        tx,
      )

      return txs
    })

    return { transactions }
  }
}
