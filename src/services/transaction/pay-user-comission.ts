import { ProfilesRepository } from '@/repositories/profiles-repository'
import { SaleItemRepository } from '@/repositories/sale-item-repository'
import { AppointmentServiceRepository } from '@/repositories/appointment-service-repository'
import { Prisma, Transaction } from '@prisma/client'
import { IncrementBalanceProfileService } from '../profile/increment-balance'
import { PaymentItems } from '../users/utils/calculatePendingCommissions'
import { round } from '@/utils/format-currency'

interface PayUserCommissionRequest {
  commissionToBePaid?: number
  userId: string
  description?: string
  allUserUnpaidSalesItemsFormatted: PaymentItems[]
  itemsToBePaid?: PaymentItems[]
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

  private async payCommissionWithValue(
    ammount: number,
    allUserUnpaidSalesItemsFormatted: PaymentItems[],
    affectedUserId: string,
    description?: string,
    tx?: Prisma.TransactionClient,
  ) {
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
        tx,
      )
      transactions.push(txDecrement.transaction)
      remaining -= value
      if (value === item.amount) {
        await this.updateCommissionPaid(item, tx)
      }
    }
    return transactions
  }

  private async payCommissionWithItems(
    affectedUserId: string,
    itemsToBePaid: PaymentItems[],
    description?: string,
    tx?: Prisma.TransactionClient,
  ) {
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
        tx,
      )
      transactions.push(txDecrement.transaction)

      await this.updateCommissionPaid(item, tx)
    }
    return transactions
  }

  // TODO: quando tento pagar passando apenas um item do barabeiro a api ta
  // pagando todos os itens pendentes dele, verificar o pq e corrigir
  async execute(
    {
      commissionToBePaid,
      userId,
      description,
      allUserUnpaidSalesItemsFormatted,
      itemsToBePaid,
    }: PayUserCommissionRequest,
    tx?: Prisma.TransactionClient,
  ): Promise<PayUserCommissionResponse> {
    if (commissionToBePaid && commissionToBePaid < 0) {
      throw new Error('Negative values not allowed')
    }
    if (itemsToBePaid) {
      const transactions = await this.payCommissionWithItems(
        userId,
        itemsToBePaid,
        description,
        tx,
      )
      return { transactions }
    }

    if (commissionToBePaid) {
      const transactions = await this.payCommissionWithValue(
        commissionToBePaid,
        allUserUnpaidSalesItemsFormatted,
        userId,
        description,
        tx,
      )
      return { transactions }
    }

    return { transactions: [] }
  }
}
