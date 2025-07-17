import { CategoryRepository } from '@/repositories/category-repository'
import { Category } from '@prisma/client'

interface CreateCategoryRequest {
  name: string
  unitId: string
}

interface CreateCategoryResponse {
  category: Category
}

export class CreateCategoryService {
  constructor(private repository: CategoryRepository) {}

  async execute({
    name,
    unitId,
  }: CreateCategoryRequest): Promise<CreateCategoryResponse> {
    const category = await this.repository.create({
      name,
      unit: { connect: { id: unitId } },
    })
    return { category }
  }
}
