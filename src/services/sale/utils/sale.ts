import { ProductRepository } from '@/repositories/product-repository'
import { Prisma } from '@prisma/client'

export function mapToSaleItems(
  tempItems: import('../types').TempItems[],
): Prisma.SaleItemCreateWithoutSaleInput[] {
  return tempItems.map((temp) => {
    const discounts = temp.discounts ?? []
    return {
      coupon: temp.data.coupon,
      quantity: temp.data.quantity,
      service: temp.data.service,
      product: temp.data.product,
      plan: temp.data.plan,
      barber: temp.data.barber,
      price: temp.price,
      discounts: {
        create: discounts.map((d) => ({
          amount: d.amount,
          type: d.type,
          origin: d.origin,
          order: d.order,
        })),
      },
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
