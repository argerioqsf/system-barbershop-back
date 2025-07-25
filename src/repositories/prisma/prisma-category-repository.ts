import { prisma } from '@/lib/prisma'
import { Prisma, Category } from '@prisma/client'
import { CategoryRepository } from '../category-repository'

export class PrismaCategoryRepository implements CategoryRepository {
  create(data: Prisma.CategoryCreateInput): Promise<Category> {
    return prisma.category.create({ data })
  }

  update(id: string, data: Prisma.CategoryUpdateInput): Promise<Category> {
    return prisma.category.update({ where: { id }, data })
  }

  findById(id: string): Promise<Category | null> {
    return prisma.category.findUnique({ where: { id } })
  }

  findMany(where: Prisma.CategoryWhereInput = {}): Promise<Category[]> {
    return prisma.category.findMany({ where })
  }
}
