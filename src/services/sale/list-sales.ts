import { UserToken } from '@/http/controllers/authenticate-controller'
import { SaleRepository } from '@/repositories/sale-repository'
import { assertPermission, getScope, buildUnitWhere } from '@/utils/permissions'
import { ListSalesResponse } from './types'
import { assertUser } from '@/utils/assert-user'

export class ListSalesService {
  constructor(private repository: SaleRepository) {}

  async execute(userToken: UserToken): Promise<ListSalesResponse> {
    assertUser(userToken)
    await assertPermission(['LIST_SALES_UNIT'], userToken.permissions)
    const scope = getScope(userToken)
    const where = buildUnitWhere(scope)
    const sales = await this.repository.findMany(where)
    return { sales }
  }
}
