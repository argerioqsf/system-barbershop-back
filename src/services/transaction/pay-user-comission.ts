import { UserFindById } from '@/repositories/barber-users-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { SaleItemRepository } from '@/repositories/sale-item-repository'
import { AppointmentServiceRepository } from '@/repositories/appointment-service-repository'
import { Prisma, Transaction } from '@prisma/client'
import { IncrementBalanceProfileService } from '../profile/increment-balance'
import { NegativeValuesNotAllowedError } from '@/services/@errors/transaction/negative-values-not-allowed-error'
import { InsufficientBalanceError } from '@/services/@errors/transaction/insufficient-balance-error'
import { PaymentItems } from '../users/utils/calculatePendingCommissions'
import { logger } from '@/lib/logger'
import { round } from '@/utils/format-currency'

interface PayUserCommissionRequest {
  valueToPay: number
  affectedUser: NonNullable<UserFindById>
  description?: string
  totalToPay: number
  paymentItems: PaymentItems[]
}

interface PayUserCommissionResponse {
  transactions: Transaction[]
}

export class PayUserCommissionService {
  constructor(
    private profileRepository: ProfilesRepository,
    private saleItemRepository: SaleItemRepository,
    private appointmentServiceRepository: AppointmentServiceRepository,
    private incrementBalanceProfileService: IncrementBalanceProfileService,
  ) {}

  async execute(
    {
      valueToPay,
      affectedUser,
      description,
      totalToPay,
      paymentItems,
    }: PayUserCommissionRequest,
    tx?: Prisma.TransactionClient,
  ): Promise<PayUserCommissionResponse> {
    const balanceUser = affectedUser.profile?.totalBalance ?? 0

    if (totalToPay < 0) {
      throw new NegativeValuesNotAllowedError()
    }

    if (totalToPay > balanceUser) {
      throw new InsufficientBalanceError()
    }

    if (valueToPay > totalToPay) {
      throw new Error('Amount to pay greater than amount to receive')
    }

    const transactions: Transaction[] = []

    let remaining = valueToPay
    for (const pay of paymentItems) {
      if (remaining <= 0) break
      const value = round(Math.min(pay.amount, remaining))
      const txDecrement = await this.incrementBalanceProfileService.execute(
        affectedUser.id,
        -value,
        pay.saleId,
        undefined,
        description,
        pay.appointmentServiceId ? undefined : pay.saleItemId,
        pay.appointmentServiceId,
        undefined,
        tx,
      )
      // resolver erro de calculos inconsistentes no pagamneto de comissao
      transactions.push(txDecrement.transaction)
      remaining -= value
      logger.debug('value', { value })
      logger.debug('remaining', { remaining })
      logger.debug('pay.amount', { amount: pay.amount })
      if (value === pay.amount) {
        if (pay.appointmentServiceId) {
          await this.appointmentServiceRepository.update(
            pay.appointmentServiceId,
            {
              commissionPaid: true,
            },
            tx,
          )
        } else if (pay.saleItemId) {
          await this.saleItemRepository.update(
            pay.saleItemId,
            {
              commissionPaid: true,
            },
            tx,
          )
        } else
          throw new Error(
            'the item must have an appointmentServiceId or saleItemId linked',
          )
      }
    }

    return { transactions }
  }
}
