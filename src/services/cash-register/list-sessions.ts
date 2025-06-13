import { UserToken } from '@/http/controllers/authenticate-controller'
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
    if (!userToken.sub) throw new Error('User not found')

    let sessions = []

    if (userToken.role === 'OWNER') {
      sessions = await this.repository.findMany({
        unit: { organizationId: userToken.organizationId },
      })
    } else if (userToken.role === 'ADMIN') {
      sessions = await this.repository.findMany()
    } else {
      sessions = await this.repository.findMany({
        unitId: userToken.unitId,
      })
    }
    return { sessions }
  }
}
