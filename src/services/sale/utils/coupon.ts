import { CouponRepository } from '@/repositories/coupon-repository'
import {
  DiscountType,
  DiscountOrigin,
  Discount,
  Prisma,
  Coupon,
} from '@prisma/client'
import { CouponNotFoundError } from '../../@errors/coupon/coupon-not-found-error'
import { CouponNotFromUserUnitError } from '../../@errors/coupon/coupon-not-from-user-unit-error'
import { CouponExhaustedError } from '../../@errors/coupon/coupon-exhausted-error'
import { ItemPriceGreaterError } from '../../@errors/sale/Item-price-greater-error'
import {
  calculateRealValueSaleItem,
  ReturnBuildItemData,
  SaleItemBuildItem,
} from './item'

export interface CouponItem {
  price: number
  ownDiscount: boolean
  discounts: Omit<Discount, 'id' | 'saleItemId'>[]
}

export type NewDiscount = Omit<Discount, 'id' | 'saleItemId'>

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
  let priceSaleItemTotal = basePrice
  const discounts: NewDiscount[] = saleItem.discounts ?? []
  let coupon: Coupon | null = null
  let order = discounts.length + 1
  let customPrice = null
  if (typeof saleItem.customPrice === 'number') {
    customPrice = saleItem.customPrice
    priceSaleItemTotal = customPrice * saleItem.quantity
    const verifyPrice = basePrice / saleItem.quantity - customPrice
    if (verifyPrice > 0) {
      discounts.push({
        amount: basePrice - priceSaleItemTotal,
        type: DiscountType.VALUE,
        origin: DiscountOrigin.VALUE_SALE_ITEM,
        order: order++,
      })
    } else if (verifyPrice < 0) {
      throw new ItemPriceGreaterError()
    }
  }

  if (saleItem.couponId) {
    coupon = await couponRepository.findById(saleItem.couponId)
    if (!coupon) throw new CouponNotFoundError()
    if (userUnitId && coupon.unitId !== userUnitId) {
      throw new CouponNotFromUserUnitError()
    }
    if (coupon.quantity <= 0) throw new CouponExhaustedError()
    console.log('priceSaleItemTotal', priceSaleItemTotal)
    console.log('coupon.discount', coupon.discount)
    const reduction =
      coupon.discountType === 'PERCENTAGE'
        ? (priceSaleItemTotal * coupon.discount) / 100
        : coupon.discount
    console.log('reduction', reduction)
    priceSaleItemTotal = Math.max(priceSaleItemTotal - reduction, 0)
    discounts.push({
      amount: coupon.discount,
      type: coupon.discountType,
      origin: DiscountOrigin.COUPON_SALE_ITEM,
      order: order++,
    })
  }

  return {
    discounts,
    coupon,
  }
}

export type discountConnection =
  | Prisma.DiscountCreateNestedManyWithoutSaleItemInput
  | undefined

export function getNextOrder(discounts: discountConnection): number {
  if (!discounts) return 1
  if (Array.isArray(discounts)) return discounts.length + 1
  if ('create' in discounts && Array.isArray(discounts.create)) {
    return discounts.create.length + 1
  }
  return 1
}

export async function applyCouponSale(
  saleItems: ReturnBuildItemData[],
  couponId: string,
  couponRepository: CouponRepository,
  userUnitId?: string,
) {
  const affectedTotal = saleItems.reduce((acc, saleItem) => {
    const realPrice = calculateRealValueSaleItem(
      saleItem.price,
      saleItem.discounts,
    )
    return acc + realPrice
  }, 0)

  const coupon = await couponRepository.findById(couponId)
  if (!coupon) throw new CouponNotFoundError()
  if (userUnitId && coupon.unitId !== userUnitId) {
    throw new CouponNotFromUserUnitError()
  }

  if (coupon.quantity <= 0) throw new CouponExhaustedError()

  for (const saleItem of saleItems) {
    const realPrice = calculateRealValueSaleItem(
      saleItem.price,
      saleItem.discounts,
    )
    let reduction = 0
    if (coupon.discountType === 'PERCENTAGE') {
      reduction = (realPrice * coupon.discount) / 100
    } else if (affectedTotal > 0) {
      reduction = (realPrice / affectedTotal) * coupon.discount
    }
    // saleItem.price = Math.max(realPrice - reduction, 0)
    const amount =
      coupon.discountType === 'PERCENTAGE' ? coupon.discount : reduction
    saleItem.discounts = [
      ...saleItem.discounts,
      {
        amount,
        type: coupon.discountType,
        origin: DiscountOrigin.COUPON_SALE,
        order: saleItem.discounts.length + 1,
      },
    ]
  }

  return { couponIdConnect: coupon.id, saleItems }
}
