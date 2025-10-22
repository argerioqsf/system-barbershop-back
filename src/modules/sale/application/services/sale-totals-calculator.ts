import { ReturnBuildItemData } from '@/modules/sale/application/dto/sale-item-dto'
import { SaleItem } from '@/modules/sale/domain/entities/sale-item'

function toDomainSaleItem(item: ReturnBuildItemData): SaleItem {
  return SaleItem.create({
    id: item.id,
    couponId: item.coupon?.id ?? null,
    basePrice: item.basePrice,
    quantity: item.quantity,
    customPrice: item.customPrice ?? undefined,
    discounts: item.discounts,
  })
}

export function calculateItemNetTotal(item: ReturnBuildItemData): number {
  return toDomainSaleItem(item).netTotal
}

export function calculateTotal(items: ReturnBuildItemData[]): number {
  return items.reduce((total, item) => total + calculateItemNetTotal(item), 0)
}

export function calculateGrossTotal(items: ReturnBuildItemData[]): number {
  return items.reduce(
    (total, item) => total + toDomainSaleItem(item).grossTotal,
    0,
  )
}
