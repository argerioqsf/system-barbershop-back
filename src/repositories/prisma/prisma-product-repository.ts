import { prisma } from '@/lib/prisma'
import { Prisma, Product } from '@prisma/client'
import { ProductRepository } from '../product-repository'

export class PrismaProductRepository implements ProductRepository {
  async create(data: Prisma.ProductCreateInput): Promise<Product> {
    return prisma.product.create({ data })
  }

  async findMany(where: Prisma.ProductWhereInput = {}): Promise<Product[]> {
    return prisma.product.findMany({ where })
  }

  async findById(id: string): Promise<Product | null> {
    return prisma.product.findUnique({ where: { id } })
  }

  async update(id: string, data: Prisma.ProductUpdateInput): Promise<Product> {
    return prisma.product.update({ where: { id }, data })
  }

  async delete(id: string): Promise<void> {
    await prisma.product.delete({ where: { id } })
  }
}
