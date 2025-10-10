import { UserToken } from '@/http/controllers/authenticate-controller'
import { TransactionRepository } from '@/repositories/transaction-repository'
import { assertUser } from '@/utils/assert-user'
import { Transaction } from '@prisma/client'

interface ListTransactionsResponse {
  transactions: Transaction[]
}

export class ListTransactionsService {
  constructor(private repository: TransactionRepository) {}

  async execute(userToken: UserToken): Promise<ListTransactionsResponse> {
    assertUser(userToken)
    const where = { unitId: userToken.unitId }
    const transactions = await this.repository.findMany(where)
    return { transactions }
  }
}
