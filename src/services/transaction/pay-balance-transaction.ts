import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { CashRegisterRepository } from '@/repositories/cash-register-repository'
import { TransactionRepository } from '@/repositories/transaction-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { SaleRepository } from '@/repositories/sale-repository'
import {
  DetailedSaleItemFindMany,
  SaleItemRepository,
} from '@/repositories/sale-item-repository'
import { AppointmentServiceRepository } from '@/repositories/appointment-service-repository'
import { UnitRepository } from '@/repositories/unit-repository'
import { LoanRepository } from '@/repositories/loan-repository'
import { PayUserLoansService } from '../loan/pay-user-loans'
import {
  BarberService,
  PaymentStatus,
  Permission,
  Profile,
  ProfileBlockedHour,
  ProfileWorkHour,
  Role,
  Service,
  Transaction,
  Unit,
  User,
} from '@prisma/client'
import { IncrementBalanceProfileService } from '../profile/increment-balance'
import { UserNotFoundError } from '@/services/@errors/user/user-not-found-error'
import { CashRegisterClosedError } from '@/services/@errors/cash-register/cash-register-closed-error'
import { AffectedUserNotFoundError } from '@/services/@errors/transaction/affected-user-not-found-error'
import { NegativeValuesNotAllowedError } from '@/services/@errors/transaction/negative-values-not-allowed-error'
import { InsufficientBalanceError } from '@/services/@errors/transaction/insufficient-balance-error'
import { SaleItemIdNotValidError } from '../@errors/sale/saleItemid-not-valid-error'
import { AppointmentServiceIdNotValidError } from '../@errors/sale/appointmentserviceid-not-valid-error'

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

type PaymentItems = {
  saleId: string
  saleItemId?: string
  appointmentServiceId?: string
  amount: number
  item: DetailedSaleItemFindMany
  service?: Service
  sale?: { createdAt: Date }
  transactions: Transaction[]
}

type AffectedUser = User & {
  profile:
    | (Profile & {
        role: Role
        permissions: Permission[]
        workHours: ProfileWorkHour[]
        blockedHours: ProfileBlockedHour[]
        barberServices: BarberService[]
      })
    | null
  unit: Unit | null
}

export class PayBalanceTransactionService {
  constructor(
    private repository: TransactionRepository,
    private barberUserRepository: BarberUsersRepository,
    private cashRegisterRepository: CashRegisterRepository,
    private profileRepository: ProfilesRepository,
    private saleRepository: SaleRepository,
    private saleItemRepository: SaleItemRepository,
    private appointmentServiceRepository: AppointmentServiceRepository,
    private unitRepository: UnitRepository,
    private loanRepository: LoanRepository,
  ) {}

  private async payItems(
    data: PayBalanceTransactionRequest,
    paymentItems: PaymentItems[],
    affectedUser: AffectedUser,
    total: number,
  ): Promise<Transaction[]> {
    const balanceUser = affectedUser.profile?.totalBalance ?? 0

    if (total < 0) {
      throw new NegativeValuesNotAllowedError()
    }

    if (total > balanceUser) {
      throw new InsufficientBalanceError()
    }

    const decrementProfile = new IncrementBalanceProfileService(
      this.profileRepository,
    )

    const transactions: Transaction[] = []

    if (data.amount) {
      if (data.amount > total) {
        throw new Error('Amount to pay greater than amount to receive')
      }
      let remaining = data.amount
      for (const pay of paymentItems) {
        if (remaining <= 0) break
        const value = Math.min(pay.amount, remaining)
        const tx = await decrementProfile.execute(
          affectedUser.id,
          -value,
          pay.saleId,
          undefined,
          data.description,
          pay.appointmentServiceId ? undefined : pay.saleItemId,
          pay.appointmentServiceId,
        )
        transactions.push(tx.transaction)
        remaining -= value

        if (value === pay.amount) {
          if (pay.appointmentServiceId) {
            await this.appointmentServiceRepository.update(
              pay.appointmentServiceId,
              {
                commissionPaid: true,
              },
            )
          } else if (pay.saleItemId) {
            await this.saleItemRepository.update(pay.saleItemId, {
              commissionPaid: true,
            })
          } else
            throw new Error(
              'the item must have an appointmentServiceId or saleItemId linked',
            )
        }
      }
    } else {
      for (const pay of paymentItems) {
        const tx = await decrementProfile.execute(
          affectedUser.id,
          -pay.amount,
          pay.saleId,
          undefined,
          data.description,
          pay.appointmentServiceId ? undefined : pay.saleItemId,
          pay.appointmentServiceId,
        )
        transactions.push(tx.transaction)
        if (pay.item && 'transactions' in pay.item) {
          pay.transactions.push(tx.transaction)
        }
        if (pay.service && 'transactions' in pay.service) {
          pay.transactions.push(tx.transaction)
        }
        if (pay.saleItemId) {
          await this.saleItemRepository.update(pay.saleItemId, {
            commissionPaid: true,
          })
        }
        if (pay.appointmentServiceId) {
          await this.appointmentServiceRepository.update(
            pay.appointmentServiceId,
            { commissionPaid: true },
          )
        }
      }
    }
    return transactions
  }

  async execute(
    data: PayBalanceTransactionRequest,
  ): Promise<PayBalanceTransactionResponse> {
    const user = await this.barberUserRepository.findById(data.userId)
    if (!user) throw new UserNotFoundError()

    const session = await this.cashRegisterRepository.findOpenByUnit(
      user.unitId,
    )
    if (!session) throw new CashRegisterClosedError()

    const affectedUser = await this.barberUserRepository.findById(
      data.affectedUserId,
    )
    if (!affectedUser) throw new AffectedUserNotFoundError()

    const paymentItems: PaymentItems[] = []

    let total = 0

    if (data.amount) {
      const salesItems = await this.saleItemRepository.findMany({
        barberId: affectedUser.id,
        sale: { paymentStatus: PaymentStatus.PAID },
        commissionPaid: false,
        OR: [{ serviceId: { not: null } }, { productId: { not: null } }],
      })
      const salesItemsAppointment = await this.saleItemRepository.findMany({
        barberId: affectedUser.id,
        sale: { paymentStatus: PaymentStatus.PAID },
        commissionPaid: false,
        appointmentId: {
          not: null,
        },
      })

      for (const item of salesItems) {
        const perc = item.porcentagemBarbeiro ?? 0
        const value = ((item.price ?? 0) * perc) / 100
        const paid =
          item.transactions?.reduce(
            (s: number, t: { amount: number }) => s + t.amount,
            0,
          ) ?? 0
        const remaining = value - paid
        if (remaining > 0) {
          total += remaining
          paymentItems.push({
            saleId: item.sale.id,
            saleItemId: item.id,
            amount: remaining,
            item,
            sale: item.sale,
            transactions: [],
          })
        }
      }

      for (const item of salesItemsAppointment) {
        for (const service of item.appointment?.services ?? []) {
          const perc = service.commissionPercentage ?? 0
          const value = (service.service.price * perc) / 100
          const paid =
            service.transactions.reduce(
              (s: number, t: { amount: number }) => s + t.amount,
              0,
            ) ?? 0
          const remaining = value - paid
          if (remaining > 0) {
            total += remaining
            paymentItems.push({
              saleId: item.sale.id,
              appointmentServiceId: service.id,
              saleItemId: item.id,
              amount: remaining,
              item,
              service: service.service,
              sale: item.sale,
              transactions: [],
            })
          }
        }
      }

      paymentItems.sort(
        (a, b) =>
          (a.sale?.createdAt.getTime() ?? 0) -
          (b.sale?.createdAt.getTime() ?? 0),
      )
    } else {
      if (data.saleItemIds?.length) {
        const saleItemIds = data.saleItemIds
        const salesItems = await this.saleItemRepository.findMany({
          id: { in: saleItemIds },
          barberId: affectedUser.id,
          sale: { paymentStatus: PaymentStatus.PAID },
          commissionPaid: false,
          OR: [{ serviceId: { not: null } }, { productId: { not: null } }],
        })

        if (salesItems.length === 0) throw new SaleItemIdNotValidError()

        for (const item of salesItems) {
          const perc = item.porcentagemBarbeiro ?? 0
          const value = ((item.price ?? 0) * perc) / 100
          total += value
          paymentItems.push({
            saleId: item.sale.id,
            saleItemId: item.id,
            amount: value,
            item,
            sale: item.sale,
            transactions: [],
          })
        }
      }

      if (data.appointmentServiceIds?.length) {
        const appointmentServiceIds = data.appointmentServiceIds
        const salesItems = await this.saleItemRepository.findMany({
          barberId: affectedUser.id,
          sale: { paymentStatus: PaymentStatus.PAID },
          commissionPaid: false,
          appointment: {
            services: {
              every: { id: { in: appointmentServiceIds } },
            },
          },
        })
        if (salesItems.length === 0)
          throw new AppointmentServiceIdNotValidError()

        const items = []
        for (const item of salesItems) {
          const services = item.appointment?.services ?? []
          for (const service of services) {
            const perc = service.commissionPercentage ?? 0
            const value = (service.service.price * perc) / 100
            total += value
            paymentItems.push({
              saleId: item.sale.id,
              appointmentServiceId: service.id,
              amount: value,
              item,
              service: service.service,
              sale: item.sale,
              transactions: [],
            })
            items.push(service)
          }
        }
      }
    }

    let payValue = data.amount ?? total
    const transactions: Transaction[] = []

    if (data.discountLoans && payValue > 0) {
      const payLoans = new PayUserLoansService(
        this.loanRepository,
        this.profileRepository,
        this.unitRepository,
        this.repository,
      )
      const res = await payLoans.execute({
        userId: affectedUser.id,
        amount: payValue,
      })
      transactions.push(...res.transactions)
      payValue = res.remaining
      data.amount = payValue
    }

    if (payValue > 0) {
      const txs = await this.payItems(data, paymentItems, affectedUser, total)
      transactions.push(...txs)
    }

    return { transactions }
  }
}
