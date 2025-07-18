import { PrismaCategoryRepository } from '@/repositories/prisma/prisma-category-repository'
import { ListCategoriesService } from '@/services/category/list-categories'

export function makeListCategoriesService() {
  const repository = new PrismaCategoryRepository()
  return new ListCategoriesService(repository)
}
