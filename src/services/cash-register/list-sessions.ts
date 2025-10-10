import { UserToken } from '@/http/controllers/authenticate-controller'
import { assertUser } from '@/utils/assert-user'
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
    const where = { unitId: userToken.unitId }
    const sessions = await this.repository.findMany(where)
    return { sessions }
  }
}
