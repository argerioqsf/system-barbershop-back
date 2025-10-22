import { CouponRepository } from '@/modules/sale/application/ports/coupon-repository'
import { CouponNotFoundError } from '@/services/@errors/coupon/coupon-not-found-error'
import { CouponNotFromUserUnitError } from '@/services/@errors/coupon/coupon-not-from-user-unit-error'
import { CouponExhaustedError } from '@/services/@errors/coupon/coupon-exhausted-error'
import { ItemPriceGreaterError } from '@/services/@errors/sale/Item-price-greater-error'
import { SaleCoupon } from '@/modules/sale/domain/entities/sale-coupon'
import {
  NewDiscount,
  ReturnBuildItemData,
  SaleItemWithDiscounts,
} from '@/modules/sale/application/dto/sale-item-dto'
import { DiscountType } from '@prisma/client'
import { logger } from '@/lib/logger'
import { CouponApplier } from '@/modules/sale/domain/services/coupon-applier'
import { InvalidSaleItemError } from '@/modules/sale/domain/errors/invalid-sale-item-error'

interface ApplyToItemParams {
  saleItem: SaleItemWithDiscounts
  basePrice: number
  userUnitId?: string
}

interface ApplyToItemResult {
  discounts: NewDiscount[]
  coupon: Awaited<ReturnType<CouponRepository['findById']>>
  finalPrice: number
  price: number
  discount: number
  discountType: DiscountType
}

interface ApplyToSaleParams {
  saleItems: ReturnBuildItemData[]
  couponId: string
  userUnitId?: string
}

interface ApplyToSaleResult {
  couponIdConnect: string
  saleItems: ReturnBuildItemData[]
}

export interface CouponServiceDeps {
  couponRepository: CouponRepository
}

export class CouponService {
  constructor(private readonly deps: CouponServiceDeps) {}

  async applyToItem({
    saleItem,
    basePrice,
    userUnitId,
  }: ApplyToItemParams): Promise<ApplyToItemResult> {
    let coupon = null
    if (saleItem.couponId) {
      coupon = await this.deps.couponRepository.findById(saleItem.couponId)
      if (!coupon) throw new CouponNotFoundError()
      SaleCoupon.create({
        id: coupon.id,
        discount: coupon.discount,
        discountType: coupon.discountType,
      })
      if (userUnitId && coupon.unitId !== userUnitId) {
        throw new CouponNotFromUserUnitError()
      }
      if (coupon.quantity <= 0) throw new CouponExhaustedError()
    }

    try {
      const result = CouponApplier.applyToItem({
        basePrice,
        quantity: saleItem.quantity,
        customPrice: saleItem.customPrice ?? null,
        discounts: saleItem.discounts ?? [],
        coupon: coupon
          ? {
              id: coupon.id,
              discount: coupon.discount,
              discountType: coupon.discountType,
            }
          : null,
      })

      logger.debug('Coupon applied to sale item', {
        saleItemId: saleItem.id,
        finalPrice: result.finalPrice,
        discount: result.discount,
        discountType: result.discountType,
      })

      return {
        discounts: result.discounts as NewDiscount[],
        coupon,
        finalPrice: result.finalPrice,
        price: result.price,
        discount: result.discount,
        discountType: result.discountType,
      }
    } catch (error) {
      if (error instanceof InvalidSaleItemError) {
        throw new ItemPriceGreaterError()
      }
      throw error
    }
  }

  async applyToSale({
    saleItems,
    couponId,
    userUnitId,
  }: ApplyToSaleParams): Promise<ApplyToSaleResult> {
    const coupon = await this.deps.couponRepository.findById(couponId)
    if (!coupon) throw new CouponNotFoundError()
    if (userUnitId && coupon.unitId !== userUnitId) {
      throw new CouponNotFromUserUnitError()
    }
    if (coupon.quantity <= 0) throw new CouponExhaustedError()

    const result = CouponApplier.applyToSale({
      items: saleItems.map((item) => ({
        id: item.id,
        price: item.price,
        basePrice: item.basePrice,
        quantity: item.quantity,
        customPrice: item.customPrice ?? null,
        discounts: item.discounts,
      })),
      coupon: {
        id: coupon.id,
        discount: coupon.discount,
        discountType: coupon.discountType,
      },
    })

    result.saleItems.forEach((updated, index) => {
      saleItems[index].discounts = updated.discounts as NewDiscount[]
    })

    return { couponIdConnect: result.couponIdConnect, saleItems }
  }
}
