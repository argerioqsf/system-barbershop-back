import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { CashRegisterRepository } from '@/repositories/cash-register-repository'
import { TransactionRepository } from '@/repositories/transaction-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'
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
    private cashRegisterRepository: CashRegisterRepository,
    private profileRepository: ProfilesRepository,
  ) {}

  async execute(
    data: CreateTransactionRequest,
  ): Promise<CreateTransactionResponse> {
    const user = await this.barberUserRepository.findById(data.userId)
    const session = await this.cashRegisterRepository.findOpenByUnit(
      user?.unitId as string,
    )
    if (!session) throw new Error('Cash register closed')
    const transaction = await this.repository.create({
      user: { connect: { id: data.userId } },
      unit: { connect: { id: user?.unitId } },
      type: data.type,
      description: data.description,
      amount: data.amount,
      session: { connect: { id: session.id } },
    })
    const increment = data.type === 'ADDITION' ? data.amount : -data.amount
    await this.profileRepository.incrementBalance(data.userId, increment)
    return { transaction }
  }
}
