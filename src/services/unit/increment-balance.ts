import { UnitRepository } from '@/repositories/unit-repository'
import {
  Prisma,
  ReasonTransaction,
  Transaction,
  TransactionType,
  Unit,
} from '@prisma/client'
import { makeCreateTransaction } from '../@factories/transaction/make-create-transaction'
import { round } from '@/utils/format-currency'
import { UnitNotFoundError } from '../@errors/unit/unit-not-found-error'
import { CreateTransactionService } from '../transaction/create-transaction'

export interface IncrementBalanceUnitResponse {
  unit: Unit | null
  transaction: Transaction
}

interface IncrementBalanceUnitOptions {
  reason?: ReasonTransaction
  tx?: Prisma.TransactionClient
}

export class IncrementBalanceUnitService {
  constructor(
    private repository: UnitRepository,
    // TODO: nao deixar o createTransactionService opcional e depois resolver o conflitos que derem no codigo
    private createTransactionService: CreateTransactionService = makeCreateTransaction(),
  ) {}

  async execute(
    id: string,
    userId: string,
    amount: number,
    saleId?: string,
    isLoan?: boolean,
    loanId?: string,
    description?: string,
    options?: IncrementBalanceUnitOptions,
  ): Promise<IncrementBalanceUnitResponse> {
    const unitToUpdate = await this.repository.findById(id, options?.tx)
    if (!unitToUpdate) {
      throw new UnitNotFoundError()
    }

    const currentBalance = unitToUpdate.totalBalance
    const newBalance = round(currentBalance + amount)

    const unit = await this.repository.update(
      id,
      { totalBalance: newBalance },
      options?.tx,
    )

    const transaction = await this.createTransactionService.execute({
      type: amount < 0 ? TransactionType.WITHDRAWAL : TransactionType.ADDITION,
      description: description ?? 'Increment Balance Unit',
      amount: Math.abs(amount),
      userId,
      receiptUrl: undefined,
      saleId,
      isLoan: isLoan ?? false,
      loanId,
      tx: options?.tx,
      reason: options?.reason ?? ReasonTransaction.OTHER,
    })
    return { unit, transaction: transaction.transaction }
  }
}
