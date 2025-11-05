import { UnitRepository } from '@/repositories/unit-repository'
import { Prisma, Transaction, TransactionType, Unit } from '@prisma/client'
import { makeCreateTransaction } from '../@factories/transaction/make-create-transaction'
import { UnitNotFoundError } from '../@errors/unit/unit-not-found-error'
import { CreateTransactionService } from '../transaction/create-transaction'
import { TransactionReason } from '@/modules/finance/domain/entities/transaction'
import { Money } from '@/core/domain/value-objects/money'

export interface IncrementBalanceUnitResponse {
  unit: Unit | null
  transaction: Transaction
}

interface IncrementBalanceUnitOptions {
  reason: TransactionReason
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
    options: IncrementBalanceUnitOptions,
    saleId?: string,
    isLoan?: boolean,
    loanId?: string,
    description?: string,
  ): Promise<IncrementBalanceUnitResponse> {
    const unitToUpdate = await this.repository.findById(id, options.tx)
    if (!unitToUpdate) {
      throw new UnitNotFoundError()
    }

    const amountMoney = Money.from(amount)
    const currentBalance = Money.from(unitToUpdate.totalBalance ?? 0)
    const newBalance = currentBalance.add(amountMoney)

    const unit = await this.repository.update(
      id,
      { totalBalance: newBalance.toNumber() },
      options.tx,
    )

    const transaction = await this.createTransactionService.execute({
      type: amountMoney.isNegative()
        ? TransactionType.WITHDRAWAL
        : TransactionType.ADDITION,
      description: description ?? 'Increment Balance Unit',
      amount: amountMoney.abs().toNumber(),
      userId,
      receiptUrl: undefined,
      saleId,
      isLoan: isLoan ?? false,
      loanId,
      tx: options.tx,
      reason: options.reason,
    })
    return { unit, transaction: transaction.transaction }
  }
}
