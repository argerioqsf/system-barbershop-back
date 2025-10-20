import { ProfilesRepository } from '@/repositories/profiles-repository'
import { SaleItemRepository } from '@/repositories/sale-item-repository'
import { AppointmentServiceRepository } from '@/repositories/appointment-service-repository'
import { Prisma, ReasonTransaction, Transaction } from '@prisma/client'
import { IncrementBalanceProfileService } from '../profile/increment-balance'
import { PaymentItems } from '../users/utils/calculatePendingCommissions'
import { round } from '@/utils/format-currency'

interface PayUserCommissionRequest {
  commissionToBePaid?: number
  userId: string
  affectedUserId: string
  description?: string
  allUserUnpaidSalesItemsFormatted: PaymentItems[]
  itemsToBePaid?: PaymentItems[]
  reason?: ReasonTransaction
}

interface PayUserCommissionResponse {
  transactions: Transaction[]
}

type PayCommissionWithItemsParams = {
  affectedUserId: string
  userId: string
  itemsToBePaid: PaymentItems[]
  description?: string
  reason?: ReasonTransaction
  tx?: Prisma.TransactionClient
}

type PayCommissionWithValueParams = {
  ammount: number
  allUserUnpaidSalesItemsFormatted: PaymentItems[]
  affectedUserId: string
  userId: string
  description?: string
  reason?: ReasonTransaction
  tx?: Prisma.TransactionClient
}

export class PayUserCommissionService {
  constructor(
    private profileRepository: ProfilesRepository,
    private saleItemRepository: SaleItemRepository,
    private appointmentServiceRepository: AppointmentServiceRepository,
    private incrementBalanceProfileService: IncrementBalanceProfileService,
  ) {}

  private async updateCommissionPaid(
    item: PaymentItems,
    tx?: Prisma.TransactionClient,
  ) {
    if (item.appointmentServiceId) {
      await this.appointmentServiceRepository.update(
        item.appointmentServiceId,
        {
          commissionPaid: true,
        },
        tx,
      )
    } else if (item.saleItemId) {
      await this.saleItemRepository.update(
        item.saleItemId,
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

  private async payCommissionWithValue({
    ammount,
    allUserUnpaidSalesItemsFormatted,
    affectedUserId,
    userId,
    description,
    reason,
    tx,
  }: PayCommissionWithValueParams) {
    let remaining = ammount
    const transactions: Transaction[] = []
    for (const item of allUserUnpaidSalesItemsFormatted) {
      if (remaining <= 0) break
      const value = round(Math.min(item.amount, remaining))
      const txDecrement = await this.incrementBalanceProfileService.execute(
        affectedUserId,
        -value,
        item.saleId,
        undefined,
        description,
        item.appointmentServiceId ? undefined : item.saleItemId,
        item.appointmentServiceId,
        undefined,
        { reason: reason ?? ReasonTransaction.PAY_COMMISSION, tx, userId },
      )
      transactions.push(txDecrement.transaction)
      remaining -= value
      if (value === item.amount) {
        await this.updateCommissionPaid(item, tx)
      }
    }
    return transactions
  }

  private async payCommissionWithItems({
    affectedUserId,
    userId,
    itemsToBePaid,
    description,
    reason,
    tx,
  }: PayCommissionWithItemsParams) {
    const transactions: Transaction[] = []
    for (const item of itemsToBePaid) {
      const value = item.amount
      const txDecrement = await this.incrementBalanceProfileService.execute(
        affectedUserId,
        -value,
        item.saleId,
        undefined,
        description,
        item.appointmentServiceId ? undefined : item.saleItemId,
        item.appointmentServiceId,
        undefined,
        { reason: reason ?? ReasonTransaction.PAY_COMMISSION, tx, userId },
      )
      transactions.push(txDecrement.transaction)

      await this.updateCommissionPaid(item, tx)
    }
    return transactions
  }

  async execute(
    {
      commissionToBePaid,
      userId,
      affectedUserId,
      description,
      allUserUnpaidSalesItemsFormatted,
      itemsToBePaid,
      reason,
    }: PayUserCommissionRequest,
    tx?: Prisma.TransactionClient,
  ): Promise<PayUserCommissionResponse> {
    if (commissionToBePaid && commissionToBePaid < 0) {
      throw new Error('Negative values not allowed')
    }
    if (itemsToBePaid) {
      const transactions = await this.payCommissionWithItems({
        affectedUserId,
        userId,
        itemsToBePaid,
        description,
        reason,
        tx,
      })
      return { transactions }
    }

    if (commissionToBePaid) {
      const transactions = await this.payCommissionWithValue({
        ammount: commissionToBePaid,
        allUserUnpaidSalesItemsFormatted,
        affectedUserId,
        userId,
        description,
        reason,
        tx,
      })
      return { transactions }
    }

    return { transactions: [] }
  }
}
