import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { CashRegisterRepository } from '@/repositories/cash-register-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import {
  DetailedSaleItemFindMany,
  SaleItemRepository,
} from '@/repositories/sale-item-repository'
import { AppointmentServiceRepository } from '@/repositories/appointment-service-repository'
import { UnitRepository } from '@/repositories/unit-repository'
import { LoanRepository } from '@/repositories/loan-repository'
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
    private profileRepository: ProfilesRepository,
    private saleItemRepository: SaleItemRepository,
    private appointmentServiceRepository: AppointmentServiceRepository,
    private unitRepository: UnitRepository,
    private loanRepository: LoanRepository,
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
      payValue = data.amount ?? 0
    } else if (typeForPayment === 'ForListIds') {
      const {
        valuesCalculateCommissions: { totalCommission },
      } = await this.calculateCommissionsForIdsHandler(
        affectedUserId,
        data.saleItemIds ?? [],
        data.appointmentServiceIds ?? [],
      )
      payValue = totalCommission ?? 0
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
    if (!affectedUser.profile?.totalBalance) {
      throw new Error('Balance user not found')
    }
    const balanceAffectedUser = affectedUser.profile.totalBalance

    const payUserCommissionService = new PayUserCommissionService(
      this.profileRepository,
      this.saleItemRepository,
      this.appointmentServiceRepository,
    )

    const payLoans = new PayUserLoansService(
      this.loanRepository,
      this.unitRepository,
    )

    const {
      valuesCalculateCommissions: { totalCommission, saleItemsRecords },
    } = await this.calculateCommissionsHandler(affectedUser.id)

    const typeForPayment = this.typeForPaymentHandler(data)
    let payValue: number = await this.getPayValueForTypeForPayment(
      typeForPayment,
      data,
      affectedUser.id,
    )

    const transactions: Transaction[] = []

    if (totalCommission !== balanceAffectedUser) {
      throw new AmountsUserInconsistentError()
    }

    if (payValue > balanceAffectedUser) {
      throw new InsufficientBalanceError()
    }

    if (data.discountLoans) {
      const {
        transactions: transactionsLoan,
        remaining: remainingAfterLoan,
        totalPaid: totalPaidLoan,
      } = await payLoans.execute({
        affectedUser,
        amount: payValue,
      })

      if (totalPaidLoan > 0) {
        const { transactions: transactionsPay } =
          await payUserCommissionService.execute({
            valueToPay: totalPaidLoan,
            affectedUser,
            description: 'Payment Loan',
            totalToPay: totalCommission,
            paymentItems: [...saleItemsRecords],
          })
        transactions.push(...transactionsPay)
      }

      transactions.push(...transactionsLoan)
      payValue = remainingAfterLoan
    }

    if (payValue > 0) {
      const { paymentItems, totalToPay } = await this.getValuesForPay(
        typeForPayment,
        affectedUser.id,
        payValue,
        data.saleItemIds,
        data.appointmentServiceIds,
      )

      const { transactions: transactionsPayUser } =
        await payUserCommissionService.execute({
          valueToPay: payValue,
          affectedUser,
          description: data.description,
          totalToPay,
          paymentItems,
        })
      transactions.push(...transactionsPayUser)
    }

    return { transactions }
  }
}
