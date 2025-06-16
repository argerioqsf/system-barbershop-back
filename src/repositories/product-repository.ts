import { Prisma, Product } from '@prisma/client'

export interface ProductRepository {
  create(data: Prisma.ProductCreateInput): Promise<Product>
  findMany(where?: Prisma.ProductWhereInput): Promise<Product[]>
  findById(id: string): Promise<Product | null>
  update(id: string, data: Prisma.ProductUpdateInput): Promise<Product>
  delete(id: string): Promise<void>
}
