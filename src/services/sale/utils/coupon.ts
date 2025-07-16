import { CouponRepository } from '@/repositories/coupon-repository'
import { CreateSaleItem, ItemDiscount, DiscountOrigin } from '../types'
import { DiscountType } from '@prisma/client'
import { CouponNotFoundError } from '../../@errors/coupon/coupon-not-found-error'
import { CouponNotFromUserUnitError } from '../../@errors/coupon/coupon-not-from-user-unit-error'
import { CouponExhaustedError } from '../../@errors/coupon/coupon-exhausted-error'
import { ItemPriceGreaterError } from '../../@errors/sale/Item-price-greater-error'

export interface CouponItem {
  price: number
  ownDiscount: boolean
  discounts: ItemDiscount[]
  data?: {
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
  const discounts: ItemDiscount[] = []
  let order = 1
  if (typeof item.price === 'number') {
    price = item.price
    if (basePrice - price > 0) {
      discount = basePrice - price
      discountType = DiscountType.VALUE
      ownDiscount = true
      discounts.push({
        amount: basePrice - price,
        type: DiscountType.VALUE,
        origin: DiscountOrigin.VALUE,
        order: order++,
      })
    } else if (basePrice - price < 0) {
      throw new ItemPriceGreaterError()
    }
  }

  if (item.couponCode) {
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
    ownDiscount = true
    discounts.push({
      amount: coupon.discount,
      type: coupon.discountType,
      origin: DiscountOrigin.COUPON,
      order: order++,
    })
    couponRel = { connect: { id: coupon.id } }
    await couponRepository.update(coupon.id, {
      quantity: { decrement: 1 },
    })
  }

  return {
    price,
    discount,
    discountType,
    ownDiscount,
    discounts,
    couponRel,
  }
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
    if (!temp.discounts) temp.discounts = []
    let reduction = 0
    if (coupon.discountType === 'PERCENTAGE') {
      reduction = (temp.price * coupon.discount) / 100
    } else if (affectedTotal > 0) {
      reduction = (temp.price / affectedTotal) * coupon.discount
    }
    temp.price = Math.max(temp.price - reduction, 0)
    temp.discounts.push({
      amount:
        coupon.discountType === 'PERCENTAGE' ? coupon.discount : reduction,
      type: coupon.discountType,
      origin: DiscountOrigin.COUPON,
      order: temp.discounts.length + 1,
    })
  }

  await couponRepository.update(coupon.id, {
    quantity: { decrement: 1 },
  })

  return { connect: { id: coupon.id } }
}
