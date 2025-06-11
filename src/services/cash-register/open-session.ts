import { CashRegisterRepository } from '@/repositories/cash-register-repository'
import { TransactionRepository } from '@/repositories/transaction-repository'
import { CashRegisterSession, TransactionType } from '@prisma/client'

interface OpenSessionRequest {
  userId: string
  unitId: string
  initialAmount: number
}

interface OpenSessionResponse {
  session: CashRegisterSession
}

export class OpenSessionService {
  constructor(
    private repository: CashRegisterRepository,
    private transactionRepository: TransactionRepository,
  ) {}

  async execute({
    userId,
    unitId,
    initialAmount,
  }: OpenSessionRequest): Promise<OpenSessionResponse> {
    const existing = await this.repository.findOpenByUnit(unitId)
    if (existing) throw new Error('Cash register already open for this unit')

    const session = await this.repository.create({
      openedBy: { connect: { id: userId } },
      unit: { connect: { id: unitId } },
      initialAmount,
    })

    if (initialAmount > 0) {
      await this.transactionRepository.create({
        user: { connect: { id: userId } },
        unit: { connect: { id: unitId } },
        session: { connect: { id: session.id } },
        type: TransactionType.ADDITION,
        description: 'Initial amount',
        amount: initialAmount,
      })
    }

    return { session }
  }
}
