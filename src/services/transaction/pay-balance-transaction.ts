import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { CashRegisterRepository } from '@/repositories/cash-register-repository'
import { TransactionRepository } from '@/repositories/transaction-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { SaleRepository } from '@/repositories/sale-repository'
import { SaleItemRepository } from '@/repositories/sale-item-repository'
import { AppointmentServiceRepository } from '@/repositories/appointment-service-repository'
import { Transaction } from '@prisma/client'
import { IncrementBalanceProfileService } from '../profile/increment-balance'
import { UserNotFoundError } from '@/services/@errors/user/user-not-found-error'
import { CashRegisterClosedError } from '@/services/@errors/cash-register/cash-register-closed-error'
import { AffectedUserNotFoundError } from '@/services/@errors/transaction/affected-user-not-found-error'
import { NegativeValuesNotAllowedError } from '@/services/@errors/transaction/negative-values-not-allowed-error'
import { InsufficientBalanceError } from '@/services/@errors/transaction/insufficient-balance-error'

interface PayBalanceTransactionRequest {
  userId: string
  affectedUserId: string
  description?: string
  amount?: number
  saleItemIds?: string[]
  appointmentServiceIds?: string[]
  receiptUrl?: string | null
}

interface PayBalanceTransactionResponse {
  transactions: Transaction[]
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
  ) {}

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

    const paymentItems: {
      saleId: string
      saleItemId?: string
      appointmentServiceId?: string
      amount: number
    }[] = []

    let total = data.amount ?? 0

    if (
      (data.saleItemIds && data.saleItemIds.length > 0) ||
      (data.appointmentServiceIds && data.appointmentServiceIds.length > 0)
    ) {
      const sales = await this.saleRepository.findManyByBarber(
        data.affectedUserId,
      )
      for (const sale of sales) {
        if (sale.paymentStatus !== 'PAID') continue
        for (const item of sale.items) {
          if (
            data.saleItemIds?.includes(item.id) &&
            !(item as any).commissionPaid
          ) {
            const perc = item.porcentagemBarbeiro ?? 0
            const value = ((item.price ?? 0) * perc) / 100
            total += value
            paymentItems.push({
              saleId: sale.id,
              saleItemId: item.id,
              amount: value,
            })
          }
          if (
            item.appointment &&
            item.appointment.services?.length &&
            data.appointmentServiceIds?.length
          ) {
            for (const srv of item.appointment.services) {
              if (
                data.appointmentServiceIds?.includes(srv.id) &&
                !(srv as any).commissionPaid
              ) {
                const perc = srv.commissionPercentage ?? 0
                const value = (srv.service.price * perc) / 100
                total += value
                paymentItems.push({
                  saleId: sale.id,
                  appointmentServiceId: srv.id,
                  amount: value,
                })
              }
            }
          }
        }
      }
    }

    if (total < 0) {
      throw new NegativeValuesNotAllowedError()
    }

    const balanceUser = affectedUser.profile?.totalBalance ?? 0
    if (total > balanceUser) {
      throw new InsufficientBalanceError()
    }

    const decrementProfile = new IncrementBalanceProfileService(
      this.profileRepository,
    )

    const transactions: Transaction[] = []

    if (data.amount && data.amount > 0) {
      const tx = await decrementProfile.execute(
        affectedUser.id,
        -data.amount,
        undefined,
        undefined,
        data.description,
      )
      transactions.push(tx.transaction)
    }

    for (const pay of paymentItems) {
      const tx = await decrementProfile.execute(
        affectedUser.id,
        -pay.amount,
        pay.saleId,
        undefined,
        data.description,
        pay.saleItemId,
        pay.appointmentServiceId,
      )
      transactions.push(tx.transaction)
      if (pay.saleItemId) {
        await this.saleItemRepository.update(
          pay.saleItemId,
          { commissionPaid: true } as any,
        )
      }
      if (pay.appointmentServiceId) {
        await this.appointmentServiceRepository.update(
          pay.appointmentServiceId,
          { commissionPaid: true } as any,
        )
      }
    }

    return { transactions }
  }
}
