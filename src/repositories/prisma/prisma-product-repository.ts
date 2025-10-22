import { prisma } from '@/lib/prisma'
import { Prisma, Product } from '@prisma/client'
import { ProductRepository } from '../product-repository'

export class PrismaProductRepository implements ProductRepository {
  async create(
    data: Prisma.ProductCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Product> {
    const prismaClient = tx || prisma
    return prismaClient.product.create({ data })
  }

  async findMany(where: Prisma.ProductWhereInput = {}): Promise<Product[]> {
    return prisma.product.findMany({ where })
  }

  async findManyPaginated(
    where: Prisma.ProductWhereInput,
    page: number,
    perPage: number,
  ): Promise<{ items: Product[]; count: number }> {
    const [count, items] = await prisma.$transaction([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ])
    return { items, count }
  }

  async findById(id: string): Promise<Product | null> {
    return prisma.product.findUnique({ where: { id } })
  }

  async update(
    id: string,
    data: Prisma.ProductUpdateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Product> {
    const prismaClient = tx || prisma
    return prismaClient.product.update({ where: { id }, data })
  }

  async delete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    const prismaClient = tx || prisma
    await prismaClient.product.delete({ where: { id } })
  }
}
