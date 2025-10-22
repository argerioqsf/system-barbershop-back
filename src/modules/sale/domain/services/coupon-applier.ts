import { DiscountOrigin, DiscountType } from '@prisma/client'

import { SaleCoupon, SaleCouponProps } from '../entities/sale-coupon'
import { SaleDiscount, SaleDiscountProps } from '../entities/sale-discount'
import { InvalidSaleItemError } from '../errors/invalid-sale-item-error'

export interface CouponApplierItemInput {
  basePrice: number
  quantity: number
  customPrice?: number | null
  discounts: SaleDiscountProps[]
  coupon?: SaleCouponProps | null
}

export interface CouponApplierItemResult {
  discounts: SaleDiscountProps[]
  finalPrice: number
  price: number
  discount: number
  discountType: DiscountType
}

export interface CouponApplierSaleInputItem {
  id?: string
  price: number
  basePrice: number
  quantity: number
  customPrice?: number | null
  discounts: SaleDiscountProps[]
}

export interface CouponApplierSaleInput {
  items: CouponApplierSaleInputItem[]
  coupon: SaleCouponProps
}

export interface CouponApplierSaleResult {
  saleItems: CouponApplierSaleInputItem[]
  couponIdConnect: string
}

export class CouponApplier {
  static applyToItem({
    basePrice,
    quantity,
    customPrice,
    discounts,
    coupon,
  }: CouponApplierItemInput): CouponApplierItemResult {
    const normalizedDiscounts = discounts.map(SaleDiscount.create)
    let order = normalizedDiscounts.length + 1
    let priceSaleItemTotal = basePrice

    if (typeof customPrice === 'number') {
      priceSaleItemTotal = customPrice * quantity
      const diffPrice = basePrice - customPrice

      if (diffPrice > 0) {
        normalizedDiscounts.push(
          SaleDiscount.create({
            amount: diffPrice,
            type: DiscountType.VALUE,
            origin: DiscountOrigin.VALUE_SALE_ITEM,
            order: order++,
          }),
        )
      } else if (diffPrice < 0) {
        throw new InvalidSaleItemError(
          'Custom price cannot be greater than base price',
        )
      }
    }

    if (coupon) {
      const couponEntity = SaleCoupon.create(coupon)

      const reduction =
        couponEntity.discountType === DiscountType.PERCENTAGE
          ? (priceSaleItemTotal * couponEntity.discount) / 100
          : couponEntity.discount

      priceSaleItemTotal = Math.max(priceSaleItemTotal - reduction, 0)

      normalizedDiscounts.push(
        SaleDiscount.create({
          amount:
            couponEntity.discountType === DiscountType.PERCENTAGE
              ? couponEntity.discount
              : couponEntity.discount,
          type: couponEntity.discountType,
          origin: DiscountOrigin.COUPON_SALE_ITEM,
          order: order++,
        }),
      )
    }

    const price = basePrice
    const discountValue = Math.max(price - priceSaleItemTotal, 0)

    return {
      discounts: normalizedDiscounts.map((discount) => discount.toPrimitives()),
      finalPrice: priceSaleItemTotal,
      price,
      discount: discountValue,
      discountType: coupon?.discountType ?? DiscountType.VALUE,
    }
  }

  static applyToSale({
    items,
    coupon,
  }: CouponApplierSaleInput): CouponApplierSaleResult {
    const couponEntity = SaleCoupon.create(coupon)

    const netTotals = items.map((item) =>
      CouponApplier.calculateNetValue(item.price, item.discounts),
    )

    const affectedTotal = netTotals.reduce((acc, value) => acc + value, 0)

    const updatedItems = items.map((item, index) => {
      const discounts = item.discounts.map(SaleDiscount.create)
      const order = discounts.length + 1

      const realPrice = netTotals[index]

      let reduction = 0

      if (couponEntity.discountType === DiscountType.PERCENTAGE) {
        reduction = (realPrice * couponEntity.discount) / 100
      } else if (affectedTotal > 0) {
        reduction = (realPrice / affectedTotal) * couponEntity.discount
      }

      const amount =
        couponEntity.discountType === DiscountType.PERCENTAGE
          ? couponEntity.discount
          : reduction

      discounts.push(
        SaleDiscount.create({
          amount,
          type: couponEntity.discountType,
          origin: DiscountOrigin.COUPON_SALE,
          order,
        }),
      )

      return {
        ...item,
        discounts: discounts.map((discount) => discount.toPrimitives()),
      }
    })

    return {
      couponIdConnect: couponEntity.id,
      saleItems: updatedItems,
    }
  }

  private static calculateNetValue(
    price: number,
    discounts: SaleDiscountProps[],
  ): number {
    const orderedDiscounts = [...discounts].sort((a, b) => a.order - b.order)

    return orderedDiscounts.reduce((current, discount) => {
      if (discount.type === DiscountType.VALUE) {
        return Math.max(current - discount.amount, 0)
      }

      if (discount.type === DiscountType.PERCENTAGE) {
        const reduction = (current * discount.amount) / 100
        return Math.max(current - reduction, 0)
      }

      return current
    }, price)
  }
}
