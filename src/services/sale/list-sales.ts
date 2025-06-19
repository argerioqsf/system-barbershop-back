import { UserToken } from '@/http/controllers/authenticate-controller'
import { SaleRepository, DetailedSale } from '@/repositories/sale-repository'
import { assertUser } from '@/utils/assert-user'
import { ListSalesResponse } from './types'

export class ListSalesService {
  constructor(private repository: SaleRepository) {}

  async execute(userToken: UserToken): Promise<ListSalesResponse> {
    assertUser(userToken)
    let sales: DetailedSale[] = []

    if (userToken.role === 'OWNER') {
      sales = await this.repository.findMany({
        unit: { organizationId: userToken.organizationId },
      })
    } else if (userToken.role === 'ADMIN') {
      sales = await this.repository.findMany()
    } else {
      sales = await this.repository.findMany({ unitId: userToken.unitId })
    }

    return { sales }
  }
}
