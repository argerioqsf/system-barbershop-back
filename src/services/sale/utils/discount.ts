import { Discount, DiscountType } from '@prisma/client'

export function computeDiscountInfo(
  price: number,
  discounts: Pick<Discount, 'amount' | 'type' | 'order'>[] = [],
): { discount: number | null; discountType: DiscountType | null } {
  if (!discounts.length) return { discount: 0, discountType: null }

  const sorted = [...discounts].sort((a, b) => a.order - b.order)

  if (sorted.length === 1) {
    return { discount: sorted[0].amount, discountType: sorted[0].type }
  }

  let value = price
  for (let i = sorted.length - 1; i >= 0; i--) {
    const d = sorted[i]
    if (d.type === 'PERCENTAGE') {
      value /= 1 - d.amount / 100
    } else {
      value += d.amount
    }
  }

  return { discount: value - price, discountType: DiscountType.VALUE }
}
