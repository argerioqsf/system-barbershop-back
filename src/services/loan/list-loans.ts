import { LoanRequestRepository } from '@/repositories/loan-request-repository'
import { UserToken } from '@/http/controllers/authenticate-controller'
import { assertUser } from '@/utils/assert-user'
import { buildUnitWhere, getScope } from '@/utils/permissions'

export class ListLoansService {
  constructor(private repository: LoanRequestRepository) {}

  async execute(user: UserToken) {
    assertUser(user)
    const scope = getScope(user)
    const where = buildUnitWhere(scope)
    const loans = await this.repository.findMany(where)
    return { loans }
  }
}
