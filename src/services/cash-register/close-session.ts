import { CashRegisterRepository } from '@/repositories/cash-register-repository'
import { CashRegisterSession, TransactionType } from '@prisma/client'
import { CashRegisterNotOpenedError } from '@/services/@errors/cash-register-not-opened-error'

interface CloseSessionRequest {
  unitId: string
}

interface CloseSessionResponse {
  session: CashRegisterSession
}

export class CloseSessionService {
  constructor(private repository: CashRegisterRepository) {}

  async execute({
    unitId,
  }: CloseSessionRequest): Promise<CloseSessionResponse> {
    const sessionOpen = await this.repository.findOpenByUnit(unitId)
    if (!sessionOpen) throw new CashRegisterNotOpenedError()

    const finalAmount = sessionOpen.transactions.reduce(
      (total, transaction) => {
        if (transaction.type === TransactionType.ADDITION)
          return total + transaction.amount
        if (transaction.type === TransactionType.WITHDRAWAL)
          return total - transaction.amount
        return total
      },
      0,
    )

    const session = await this.repository.close(sessionOpen.id, {
      finalAmount,
      closedAt: new Date(),
    })
    return { session }
  }
}
