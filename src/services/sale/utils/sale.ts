import { ProductRepository } from '@/repositories/product-repository'

export function mapToSaleItems(
  tempItems: import('../types').TempItems[],
): import('../types').SaleItemTemp[] {
  return tempItems.map((temp) => ({
    coupon: temp.data.coupon,
    quantity: temp.data.quantity,
    service: temp.data.service,
    product: temp.data.product,
    barber: temp.data.barber,
    price: temp.price,
    discount: temp.discount,
    discountType: temp.discountType,
    appointment: temp.data.appointment,
  }))
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
