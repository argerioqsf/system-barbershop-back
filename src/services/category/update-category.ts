import { CategoryRepository } from '@/repositories/category-repository'
import { Category, Prisma } from '@prisma/client'

interface UpdateCategoryRequest {
  id: string
  data: Prisma.CategoryUpdateInput
}

interface UpdateCategoryResponse {
  category: Category
}

export class UpdateCategoryService {
  constructor(private repository: CategoryRepository) {}

  async execute({
    id,
    data,
  }: UpdateCategoryRequest): Promise<UpdateCategoryResponse> {
    const category = await this.repository.update(id, data)
    return { category }
  }
}
