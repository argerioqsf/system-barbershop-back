import { ProductRepository } from '@/repositories/product-repository'
import { DiscountType, Prisma } from '@prisma/client'

export function mapToSaleItems(
  tempItems: import('../types').TempItems[],
): import('../types').SaleItemTemp[] {
  return tempItems.map((temp) => {
    const discountTotal = temp.basePrice - temp.price
    let discount = discountTotal > 0 ? discountTotal : 0
    let discountType: DiscountType | null = null
    const discounts = temp.discounts ?? []
    if (discounts.length === 1) {
      discountType = discounts[0].type
      discount = discounts[0].amount
    } else if (discountTotal > 0) {
      discountType = DiscountType.VALUE
    }
    return {
      coupon: temp.data.coupon,
      quantity: temp.data.quantity,
      service: temp.data.service,
      product: temp.data.product,
      plan: temp.data.plan,
      barber: temp.data.barber,
      price: temp.price,
      discount,
      discountType,
      discounts: discounts as Prisma.JsonValue,
      appointment: temp.data.appointment,
      commissionPaid: false,
    }
  })
}

export function calculateTotal(
  tempItems: import('../types').TempItems[],
): number {
  return tempItems.reduce((acc, i) => acc + i.price, 0)
}

export async function updateProductsStock(
  repository: ProductRepository,
  products: { id: string; quantity: number }[],
  mode: 'increment' | 'decrement' = 'decrement',
): Promise<void> {
  for (const prod of products) {
    await repository.update(prod.id, {
      quantity: { [mode]: prod.quantity },
    })
  }
}
