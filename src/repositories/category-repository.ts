import { Prisma, Category } from '@prisma/client'

export interface CategoryRepository {
  create(data: Prisma.CategoryCreateInput): Promise<Category>
  update(id: string, data: Prisma.CategoryUpdateInput): Promise<Category>
  findById(id: string): Promise<Category | null>
  findMany(where?: Prisma.CategoryWhereInput): Promise<Category[]>
}
