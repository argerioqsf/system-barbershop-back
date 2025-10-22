import { CouponRepository } from '@/repositories/coupon-repository'
import {
  ReturnBuildItemData,
  SaleItemBuildItem,
  SaleItemWithDiscounts,
  NewDiscount,
} from '@/modules/sale/application/dto/sale-item-dto'
import { CouponService } from '@/modules/sale/application/services/coupon-service'

export type RequestApplyCouponSaleItem = {
  saleItem: SaleItemBuildItem & { discounts: NewDiscount[] }
  basePrice: number
  couponRepository: CouponRepository
  userUnitId?: string
}

export async function applyCouponSaleItem({
  saleItem,
  basePrice,
  couponRepository,
  userUnitId,
}: RequestApplyCouponSaleItem) {
  const couponService = new CouponService({ couponRepository })
  return couponService.applyToItem({
    saleItem: saleItem as SaleItemWithDiscounts,
    basePrice,
    userUnitId,
  })
}

export async function applyCouponSale(
  saleItems: ReturnBuildItemData[],
  couponId: string,
  couponRepository: CouponRepository,
  userUnitId?: string,
) {
  const couponService = new CouponService({ couponRepository })
  return couponService.applyToSale({
    saleItems,
    couponId,
    userUnitId,
  })
}

export type discountConnection = never

export function getNextOrder(): number {
  return 1
}

export type CouponItem = {
  price: number
  ownDiscount: boolean
  discounts: NewDiscount[]
}

export { NewDiscount } from '@/modules/sale/application/dto/sale-item-dto'
