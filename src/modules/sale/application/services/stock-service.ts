import { Prisma } from '@prisma/client'

import { ProductRepository } from '@/modules/sale/application/ports/product-repository'
import { ProductNotFoundError } from '@/services/@errors/product/product-not-found-error'
import { InsufficientStockError } from '@/services/@errors/product/insufficient-stock-error'

export interface StockAdjustment {
  id: string
  quantity: number
}

export class StockService {
  constructor(private readonly productRepository: ProductRepository) {}

  async ensureAvailability(products: StockAdjustment[]): Promise<void> {
    for (const product of products) {
      const found = await this.productRepository.findById(product.id)
      if (!found) throw new ProductNotFoundError()
      if (found.quantity < product.quantity) {
        throw new InsufficientStockError()
      }
    }
  }

  async adjust(
    products: StockAdjustment[],
    mode: 'increment' | 'decrement',
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    for (const product of products) {
      await this.productRepository.update(
        product.id,
        {
          quantity: { [mode]: product.quantity },
        },
        tx,
      )
    }
  }
}
