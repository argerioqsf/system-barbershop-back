import { CashRegisterRepository } from '@/repositories/cash-register-repository'
import { CashRegisterSession, TransactionType } from '@prisma/client'

interface CloseSessionRequest {
  sessionId: string
}

interface CloseSessionResponse {
  session: CashRegisterSession
}

export class CloseSessionService {
  constructor(private repository: CashRegisterRepository) {}

  async execute({ sessionId }: CloseSessionRequest): Promise<CloseSessionResponse> {
    const sessionData = await this.repository.findById(sessionId)
    if (!sessionData) throw new Error('Session not found')

    const finalAmount = sessionData.transactions.reduce((total, transaction) => {
      if (transaction.type === TransactionType.ADDITION) return total + transaction.amount
      if (transaction.type === TransactionType.WITHDRAWAL) return total - transaction.amount
      return total
    }, 0)

    const session = await this.repository.close(sessionId, {
      finalAmount,
      closedAt: new Date(),
    })
    return { session }
  }
}
