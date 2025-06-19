import { Prisma, Product } from '@prisma/client'
import { ProductRepository } from '../product-repository'
import { randomUUID } from 'crypto'

export class InMemoryProductRepository implements ProductRepository {
  constructor(public products: Product[] = []) {}

  async create(data: Prisma.ProductCreateInput): Promise<Product> {
    const product: Product = {
      id: randomUUID(),
      name: data.name,
      description: (data.description as string | null) ?? null,
      imageUrl: (data.imageUrl as string | null) ?? null,
      quantity: (data.quantity as number) ?? 0,
      cost: data.cost as number,
      price: data.price as number,
      unitId: (data.unit as any).connect.id,
    }
    this.products.push(product)
    return product
  }

  async findMany(where: Prisma.ProductWhereInput = {}): Promise<Product[]> {
    return this.products.filter((p: any) => {
      if (where.unitId && p.unitId !== where.unitId) return false
      if (where.unit && 'organizationId' in (where.unit as any)) {
        return p.organizationId === (where.unit as any).organizationId
      }
      return true
    })
  }

  async findById(id: string): Promise<Product | null> {
    return this.products.find((p) => p.id === id) ?? null
  }

  async update(id: string, data: Prisma.ProductUpdateInput): Promise<Product> {
    const product = this.products.find((p) => p.id === id)
    if (!product) throw new Error('Product not found')
    if (
      data.quantity &&
      typeof data.quantity === 'object' &&
      'decrement' in data.quantity
    ) {
      product.quantity -= data.quantity.decrement as number
    }
    if (data.name) product.name = data.name as string
    if ('description' in data) {
      product.description = data.description as any
    }
    if ('imageUrl' in data) {
      product.imageUrl = data.imageUrl as any
    }
    if (data.cost) product.cost = data.cost as number
    if (data.price) product.price = data.price as number
    return product
  }

  async delete(id: string): Promise<void> {
    this.products = this.products.filter((p) => p.id !== id)
  }
}
