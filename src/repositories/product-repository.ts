import { Prisma, Product } from '@prisma/client'

export interface ProductRepository {
  create(
    data: Prisma.ProductCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Product>
  findMany(where?: Prisma.ProductWhereInput): Promise<Product[]>
  findManyPaginated(
    where: Prisma.ProductWhereInput,
    page: number,
    perPage: number,
  ): Promise<{ items: Product[]; count: number }>
  findById(id: string): Promise<Product | null>
  update(
    id: string,
    data: Prisma.ProductUpdateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Product>
  delete(id: string, tx?: Prisma.TransactionClient): Promise<void>
}
