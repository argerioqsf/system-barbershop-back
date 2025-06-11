import { BarberUsersRepository } from '@/repositories/barber-users-repository'
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
  constructor(
    private repository: TransactionRepository,
    private barberUserRepository: BarberUsersRepository,
  ) {}

  async execute(
    data: CreateTransactionRequest,
  ): Promise<CreateTransactionResponse> {
    const user = await this.barberUserRepository.findById(data.userId)
    const transaction = await this.repository.create({
      user: { connect: { id: data.userId } },
      unit: { connect: { id: user?.unitId } },
      type: data.type,
      description: data.description,
      amount: data.amount,
    })
    return { transaction }
  }
}
