import { PrismaCategoryRepository } from '@/repositories/prisma/prisma-category-repository'
import { CreateCategoryService } from '@/services/category/create-category'

export function makeCreateCategoryService() {
  const repository = new PrismaCategoryRepository()
  const service = new CreateCategoryService(repository)
  return service
}
