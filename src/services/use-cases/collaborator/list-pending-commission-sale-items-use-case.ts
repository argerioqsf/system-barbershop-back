import { logger } from '@/lib/logger'
import {
  ReturnFindManyPendingCommission,
  SaleItemRepository,
} from '@/repositories/sale-item-repository'
import { calculateRealValueSaleItem } from '@/services/sale/utils/item'
import { SaleItem } from '@prisma/client'
export type SaleItemWithRemainingValue = SaleItem & {
  remainingValue: number
}
export class ListPendingCommissionSaleItemsUseCase {
  constructor(private saleItemRepository: SaleItemRepository) {}

  private calculateRemainingForItem(
    saleItems: ReturnFindManyPendingCommission[],
  ): SaleItemWithRemainingValue[] {
    const saleItemWithRemainingValue: SaleItemWithRemainingValue[] = []

    for (const saleItem of saleItems) {
      const porcentagemBarbeiro = saleItem.porcentagemBarbeiro ?? 0
      logger.debug('porcentagemBarbeiro: ', { porcentagemBarbeiro })
      logger.debug(
        'calculateRealValueSaleItem(saleItem.price, saleItem.discounts): ',
        {
          realValue: calculateRealValueSaleItem(
            saleItem.price,
            saleItem.discounts,
          ),
        },
      )
      const realValue =
        calculateRealValueSaleItem(saleItem.price, saleItem.discounts) *
        (porcentagemBarbeiro / 100)
      const transactions = saleItem.transactions
      logger.debug('realValueForBarber: ', { realValue })

      if (transactions.length > 0) {
        const remainingValue = transactions.reduce(
          (acc, transaction) => acc - transaction.amount,
          realValue,
        )
        saleItemWithRemainingValue.push({
          ...saleItem,
          remainingValue,
        })
        continue
      }

      saleItemWithRemainingValue.push({
        ...saleItem,
        remainingValue: realValue,
      })
    }
    return saleItemWithRemainingValue
  }

  async execute(userId: string) {
    const saleItems = await this.saleItemRepository.findManyPendingCommission(
      userId,
    )
    logger.debug('saleItems length: ', { length: saleItems.length })

    return this.calculateRemainingForItem(saleItems)
  }
}
