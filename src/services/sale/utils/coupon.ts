import { CouponRepository } from '@/repositories/coupon-repository'
import { CreateSaleItem } from '../types'
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
import { ReturnBuildItemData } from './item'

export interface CouponItem {
  price: number
  ownDiscount: boolean
  discounts: Omit<Discount, 'id' | 'saleItemId'>[]
}

export type NewDiscount = Omit<Discount, 'id' | 'saleItemId'>

export type RequestApplyCouponSaleItem = {
  saleItem: CreateSaleItem
  basePrice: number
  discount: number
  discountType: DiscountType | null
  ownDiscount: boolean
  couponRepository: CouponRepository
  userUnitId?: string
}

export async function applyCouponSaleItem({
  saleItem,
  basePrice,
  discount,
  discountType,
  ownDiscount,
  couponRepository,
  userUnitId,
}: RequestApplyCouponSaleItem) {
  let price = basePrice
  const discounts: NewDiscount[] = []
  let coupon: Coupon | null = null
  let order = 1
  if (typeof saleItem.customPrice === 'number') {
    const customPrice = saleItem.customPrice
    price = customPrice
    if (basePrice - customPrice > 0) {
      discount = basePrice - customPrice
      discountType = DiscountType.VALUE
      ownDiscount = true
      discounts.push({
        amount: basePrice - customPrice,
        type: DiscountType.VALUE,
        origin: DiscountOrigin.VALUE_SALE_ITEM,
        order: order++,
      })
    } else if (basePrice - customPrice < 0) {
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
    const reduction =
      coupon.discountType === 'PERCENTAGE'
        ? (basePrice * coupon.discount) / 100
        : coupon.discount
    price = Math.max(basePrice - reduction, 0)
    discount =
      coupon.discountType === 'PERCENTAGE' ? coupon.discount : reduction
    discountType = coupon.discountType
    ownDiscount = true
    discounts.push({
      amount: coupon.discount,
      type: coupon.discountType,
      origin: DiscountOrigin.COUPON_SALE_ITEM,
      order: order++,
    })
  }

  return {
    price,
    discount,
    discountType,
    ownDiscount,
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
  considerOwnDiscount = true,
) {
  const affectedTotal = saleItems.reduce(
    (acc, saleItem) => acc + saleItem.price,
    0,
  )

  const coupon = await couponRepository.findById(couponId)
  if (!coupon) throw new CouponNotFoundError()
  if (userUnitId && coupon.unitId !== userUnitId) {
    throw new CouponNotFromUserUnitError()
  }

  if (coupon.quantity <= 0) throw new CouponExhaustedError()
  for (const saleItem of saleItems) {
    const ownDiscount = false
    if (ownDiscount && considerOwnDiscount) continue
    let reduction = 0
    if (coupon.discountType === 'PERCENTAGE') {
      reduction = (saleItem.price * coupon.discount) / 100
    } else if (affectedTotal > 0) {
      reduction = (saleItem.price / affectedTotal) * coupon.discount
    }
    saleItem.price = Math.max(saleItem.price - reduction, 0)
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
