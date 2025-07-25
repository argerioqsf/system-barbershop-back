import { UserToken } from '@/http/controllers/authenticate-controller'
import { CategoryRepository } from '@/repositories/category-repository'
import { assertUser } from '@/utils/assert-user'
import { Category } from '@prisma/client'

interface ListCategoriesResponse {
  categories: Category[]
}

export class ListCategoriesService {
  constructor(private repository: CategoryRepository) {}

  async execute(user: UserToken): Promise<ListCategoriesResponse> {
    assertUser(user)
    const categories = await this.repository.findMany({ unitId: user.unitId })
    return { categories }
  }
}
