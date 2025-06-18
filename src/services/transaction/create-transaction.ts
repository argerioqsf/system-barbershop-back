import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { CashRegisterRepository } from '@/repositories/cash-register-repository'
import { TransactionRepository } from '@/repositories/transaction-repository'
import { Transaction, TransactionType } from '@prisma/client'

interface CreateTransactionRequest {
  userId: string
  affectedUserId?: string
  type: TransactionType
  description: string
  amount: number
  receiptUrl?: string | null
  saleId?: string
  loanAmount?: number | null
}

interface CreateTransactionResponse {
  transaction: Transaction
}

export class CreateTransactionService {
  constructor(
    private repository: TransactionRepository,
    private barberUserRepository: BarberUsersRepository,
    private cashRegisterRepository: CashRegisterRepository,
  ) {}

  async execute(
    data: CreateTransactionRequest,
  ): Promise<CreateTransactionResponse> {
    const user = await this.barberUserRepository.findById(data.userId)
    if (!user) throw new Error('User not found')

    const session = await this.cashRegisterRepository.findOpenByUnit(
      user.unitId,
    )
    if (!session) throw new Error('Cash register closed')

    let affectedUser
    if (data.affectedUserId) {
      affectedUser = await this.barberUserRepository.findById(
        data.affectedUserId,
      )
      if (!affectedUser) throw new Error('Affected user not found')
    }

    const effectiveUser = affectedUser ?? user

    const transaction = await this.repository.create({
      user: { connect: { id: effectiveUser.id } },
      unit: { connect: { id: effectiveUser.unitId } },
      session: { connect: { id: session.id } },
      sale: data.saleId ? { connect: { id: data.saleId } } : undefined,
      type: data.type,
      description: data.description,
      amount: data.amount,
      loanAmount: data.loanAmount ?? null,
      receiptUrl: data.receiptUrl ?? null,
      affectedUser: affectedUser
        ? { connect: { id: effectiveUser.id } }
        : undefined,
    })

    return { transaction }
  }
}
