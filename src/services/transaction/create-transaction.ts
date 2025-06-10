import { TransactionRepository } from '@/repositories/transaction-repository'
import { Transaction, TransactionType } from '@prisma/client'

interface CreateTransactionRequest {
  userId: string
  type: TransactionType
  description: string
  amount: number
}

interface CreateTransactionResponse {
  transaction: Transaction
}

export class CreateTransactionService {
  constructor(private repository: TransactionRepository) {}

  async execute(data: CreateTransactionRequest): Promise<CreateTransactionResponse> {
    const transaction = await this.repository.create({
      user: { connect: { id: data.userId } },
      type: data.type,
      description: data.description,
      amount: data.amount,
    })
    return { transaction }
  }
}
