import { Prisma, Category } from '@prisma/client'
import { randomUUID } from 'crypto'
import { CategoryRepository } from '../category-repository'

export class InMemoryCategoryRepository implements CategoryRepository {
  constructor(public categories: Category[] = []) {}

  async create(data: Prisma.CategoryCreateInput): Promise<Category> {
    const category: Category = {
      id: randomUUID(),
      name: data.name,
      unitId: (data.unit as { connect: { id: string } }).connect.id,
    }
    this.categories.push(category)
    return category
  }

  async update(
    id: string,
    data: Prisma.CategoryUpdateInput,
  ): Promise<Category> {
    const category = this.categories.find((c) => c.id === id)
    if (!category) throw new Error('Category not found')
    if (data.name) category.name = data.name as string
    if (data.unit && 'connect' in data.unit) {
      category.unitId = (data.unit as { connect: { id: string } }).connect.id
    }
    return category
  }

  async findById(id: string): Promise<Category | null> {
    return this.categories.find((c) => c.id === id) ?? null
  }

  async findMany(where: Prisma.CategoryWhereInput = {}): Promise<Category[]> {
    return this.categories.filter((c) => {
      if (where.unitId && c.unitId !== where.unitId) return false
      return true
    })
  }
}
