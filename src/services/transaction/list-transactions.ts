import { UserToken } from '@/http/controllers/authenticate-controller'
import { TransactionFull } from '@/repositories/prisma/prisma-transaction-repository'
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

    let transactions: TransactionFull[] = []

    if (userToken.role === 'OWNER') {
      transactions = await this.repository.findMany({
        unit: { organizationId: userToken.organizationId },
      })
    } else if (userToken.role === 'ADMIN') {
      transactions = await this.repository.findMany()
    } else {
      transactions = await this.repository.findMany({
        unitId: userToken.unitId,
      })
    }

    return { transactions }
  }
}
