import { UserToken } from '@/http/controllers/authenticate-controller'
import { TransactionRepository } from '@/repositories/transaction-repository'
import { assertUser } from '@/utils/assert-user'
import { assertPermission, getScope, buildUnitWhere } from '@/utils/permissions'
import { Transaction } from '@prisma/client'

interface ListTransactionsResponse {
  transactions: Transaction[]
}

export class ListTransactionsService {
  constructor(private repository: TransactionRepository) {}

  async execute(userToken: UserToken): Promise<ListTransactionsResponse> {
    assertUser(userToken)
    assertPermission(userToken.role, 'LIST_TRANSACTIONS')
    const scope = getScope(userToken)
    const where = buildUnitWhere(scope)
    const transactions = await this.repository.findMany(where)
    return { transactions }
  }
}
