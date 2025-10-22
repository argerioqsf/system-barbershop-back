import { Prisma } from '@prisma/client'

import { SaleItemRepository } from '@/modules/sale/application/ports/sale-item-repository'
import { NewDiscount } from '@/modules/sale/application/dto/sale-item-dto'

export interface DiscountCarrier {
  discounts: NewDiscount[]
}

export class DiscountSyncService {
  constructor(private readonly saleItemRepository: SaleItemRepository) {}

  async sync(
    saleItem: DiscountCarrier,
    saleItemId: string,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const newDiscounts = saleItem.discounts
    await this.saleItemRepository.update(
      saleItemId,
      {
        ...(newDiscounts
          ? {
              discounts: {
                deleteMany: {},
                create: newDiscounts.map((d) => ({
                  amount: d.amount,
                  type: d.type,
                  origin: d.origin,
                  order: d.order,
                })),
              },
            }
          : {}),
      },
      tx,
    )
  }
}
