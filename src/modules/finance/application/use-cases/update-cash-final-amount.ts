import { TransactionClient } from '@/core/application/ports/transaction-runner'
import { CashRegisterRepositoryPort } from '@/modules/finance/application/ports/cash-register-repository'
import { UpdateCashFinalAmountDTO } from '../dto/update-cash-final-amount.dto'

export class UpdateCashFinalAmountUseCase {
  constructor(
    private readonly cashRegisterRepository: CashRegisterRepositoryPort,
  ) {}

  async execute(
    { sessionId, amount }: UpdateCashFinalAmountDTO,
    tx?: TransactionClient,
  ): Promise<void> {
    await this.cashRegisterRepository.incrementFinalAmount(
      sessionId,
      amount,
      tx,
    )
  }
}
