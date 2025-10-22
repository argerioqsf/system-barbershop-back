import { DiscountOrigin, DiscountType } from '@prisma/client'

import { SaleItemPrice } from '../entities/sale-item-price'
import { SaleDiscountProps } from '../entities/sale-discount'

export interface PlanBenefit {
  id: string
  discount?: number | null
  discountType?: DiscountType | null
  categories: { categoryId: string }[]
  services: { serviceId: string }[]
  products: { productId: string }[]
}

export interface PlanBenefitItem {
  service?: { id: string; categoryId: string | null } | null
  product?: { id: string; categoryId: string | null } | null
  quantity: number
  price: number
  basePrice: number
  customPrice?: number | null
  discounts: SaleDiscountProps[]
}

export class PlanBenefitApplier {
  static applyBenefitsToItems(
    items: PlanBenefitItem[],
    benefits: PlanBenefit[],
  ): PlanBenefitItem[] {
    if (benefits.length === 0) return items

    return items.map((item) => {
      const netTotal = PlanBenefitApplier.calculateItemNetTotal(item)
      if (netTotal <= 0) return item

      let discounts = [...item.discounts]

      for (const benefit of benefits) {
        const applied = PlanBenefitApplier.applyBenefitToItem(
          { ...item, discounts },
          netTotal,
          benefit,
        )
        if (applied) {
          discounts = applied
        }
      }

      return {
        ...item,
        discounts,
      }
    })
  }

  private static calculateItemNetTotal(item: PlanBenefitItem): number {
    const price = SaleItemPrice.create({
      basePrice: item.basePrice,
      quantity: item.quantity,
      customPrice: item.customPrice ?? undefined,
      discounts: item.discounts,
    })
    return price.netTotal
  }

  private static applyBenefitToItem(
    item: PlanBenefitItem,
    realPriceItem: number,
    benefit: PlanBenefit,
  ): SaleDiscountProps[] | null {
    if (!item.service && !item.product) return null

    const categoryId = item.service
      ? item.service.categoryId
      : item.product?.categoryId

    const matchesCategory = categoryId
      ? benefit.categories.some(
          (category) => category.categoryId === categoryId,
        )
      : false
    const matchesService = item.service
      ? benefit.services.some(
          (service) => service.serviceId === item.service?.id,
        )
      : false
    const matchesProduct = item.product
      ? benefit.products.some(
          (product) => product.productId === item.product?.id,
        )
      : false

    if (!matchesCategory && !matchesService && !matchesProduct) return null

    const discountValue = PlanBenefitApplier.calculateBenefitValue(
      realPriceItem,
      benefit.discount ?? 0,
      benefit.discountType ?? DiscountType.VALUE,
    )

    if (discountValue <= 0) return null

    const amount =
      benefit.discountType === DiscountType.PERCENTAGE
        ? benefit.discount ?? 0
        : discountValue

    return [
      ...item.discounts,
      {
        amount,
        type: (benefit.discountType ?? DiscountType.VALUE) as DiscountType,
        origin: DiscountOrigin.PLAN,
        order: item.discounts.length + 1,
      },
    ]
  }

  private static calculateBenefitValue(
    baseAmount: number,
    discount: number,
    discountType: DiscountType,
  ): number {
    if (discount <= 0) return 0

    if (discountType === DiscountType.PERCENTAGE) {
      return Math.min((baseAmount * discount) / 100, baseAmount)
    }

    return Math.min(discount, baseAmount)
  }
}
