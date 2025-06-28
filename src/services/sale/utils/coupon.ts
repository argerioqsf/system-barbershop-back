import { CouponRepository } from '@/repositories/coupon-repository'
import { CreateSaleItem } from '../types'
import { DiscountType } from '@prisma/client'
import { CouponNotFoundError } from '../../@errors/coupon/coupon-not-found-error'
import { CouponNotFromUserUnitError } from '../../@errors/coupon/coupon-not-from-user-unit-error'
import { CouponExhaustedError } from '../../@errors/coupon/coupon-exhausted-error'
import { ItemPriceGreaterError } from '../../@errors/sale/Item-price-greater-error'

export interface CouponItem {
  price: number
  ownDiscount: boolean
  discount?: number
  discountType?: DiscountType | null
  data?: {
    discount?: number | null
    discountType?: DiscountType | null
    [key: string]: unknown
  }
}

export async function applyCouponToSale(
  item: CreateSaleItem,
  price: number,
  basePrice: number,
  discount: number,
  discountType: DiscountType | null,
  ownDiscount: boolean,
  couponRepository: CouponRepository,
  userUnitId?: string,
  couponRel?: { connect: { id: string } },
) {
  if (typeof item.price === 'number') {
    price = item.price
    if (basePrice - price > 0) {
      discount = basePrice - price
      discountType = DiscountType.VALUE
      ownDiscount = true
    } else if (basePrice - price < 0) {
      throw new ItemPriceGreaterError()
    }
  } else if (item.couponCode) {
    const coupon = await couponRepository.findByCode(item.couponCode)
    if (!coupon) throw new CouponNotFoundError()
    if (userUnitId && coupon.unitId !== userUnitId) {
      throw new CouponNotFromUserUnitError()
    }
    if (coupon.quantity <= 0) throw new CouponExhaustedError()
    const reduction =
      coupon.discountType === 'PERCENTAGE'
        ? (price * coupon.discount) / 100
        : coupon.discount
    price = Math.max(price - reduction, 0)
    discount =
      coupon.discountType === 'PERCENTAGE' ? coupon.discount : reduction
    discountType = coupon.discountType
    couponRel = { connect: { id: coupon.id } }
    await couponRepository.update(coupon.id, {
      quantity: { decrement: 1 },
    })
    ownDiscount = true
  }

  return { price, discount, discountType, ownDiscount, couponRel }
}

export async function applyCouponToItems(
  items: CouponItem[],
  couponCode: string,
  couponRepository: CouponRepository,
  userUnitId?: string,
) {
  const affectedTotal = items
    .filter((i) => !i.ownDiscount)
    .reduce((acc, i) => acc + i.price, 0)
  const coupon = await couponRepository.findByCode(couponCode)
  if (!coupon) throw new CouponNotFoundError()
  if (userUnitId && coupon.unitId !== userUnitId) {
    throw new CouponNotFromUserUnitError()
  }
  if (coupon.quantity <= 0) throw new CouponExhaustedError()

  for (const temp of items) {
    if (temp.ownDiscount) continue
    if (coupon.discountType === 'PERCENTAGE') {
      const reduction = (temp.price * coupon.discount) / 100
      temp.price = Math.max(temp.price - reduction, 0)
      if (typeof temp.discount !== 'undefined') {
        temp.discount = coupon.discount
      }
      if (temp.data) {
        temp.data.discount = coupon.discount
      }
    } else if (affectedTotal > 0) {
      const part = (temp.price / affectedTotal) * coupon.discount
      temp.price = Math.max(temp.price - part, 0)
      if (typeof temp.discount !== 'undefined') {
        temp.discount = part
      }
      if (temp.data) {
        temp.data.discount = part
      }
    }
    if (typeof temp.discountType !== 'undefined') {
      temp.discountType = coupon.discountType
    }
    if (temp.data) {
      temp.data.discountType = coupon.discountType
    }
  }

  await couponRepository.update(coupon.id, {
    quantity: { decrement: 1 },
  })

  return { connect: { id: coupon.id } }
}
