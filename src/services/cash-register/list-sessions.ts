import { UserToken } from '@/http/controllers/authenticate-controller'
import { assertUser } from '@/utils/assert-user'
import { assertPermission, getScope, buildUnitWhere } from '@/utils/permissions'
import {
  CashRegisterRepository,
  DetailedCashSession,
} from '@/repositories/cash-register-repository'

interface ListSessionsResponse {
  sessions: DetailedCashSession[]
}

export class ListSessionsService {
  constructor(private repository: CashRegisterRepository) {}

  async execute(userToken: UserToken): Promise<ListSessionsResponse> {
    assertUser(userToken)
    assertPermission(userToken.role, 'LIST_CASH_SESSIONS')
    const scope = getScope(userToken)
    const where = buildUnitWhere(scope)
    const sessions = await this.repository.findMany(where)
    return { sessions }
  }
}
