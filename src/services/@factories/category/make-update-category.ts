import { PrismaCategoryRepository } from '@/repositories/prisma/prisma-category-repository'
import { UpdateCategoryService } from '@/services/category/update-category'

export function makeUpdateCategoryService() {
  const repository = new PrismaCategoryRepository()
  const service = new UpdateCategoryService(repository)
  return service
}
