import { CashRegisterRepository } from '@/repositories/cash-register-repository'
import { Prisma } from '@prisma/client'

interface UpdateCashRegisterFinalAmountRequest {
  sessionId: string
  amount: number
}

export class UpdateCashRegisterFinalAmountService {
  constructor(private cashRegisterRepository: CashRegisterRepository) {}

  async execute(
    { sessionId, amount }: UpdateCashRegisterFinalAmountRequest,
    tx?: Prisma.TransactionClient,
  ) {
    await this.cashRegisterRepository.incrementFinalAmount(
      sessionId,
      amount,
      tx,
    )
  }
}
