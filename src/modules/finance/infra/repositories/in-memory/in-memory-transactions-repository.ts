import { randomUUID } from 'crypto'
import {
  Prisma,
  ReasonTransaction,
  Transaction,
  TransactionType,
} from '@prisma/client'
import { Money } from '@/core/domain/value-objects/money'
import {
  CreateTransactionInput,
  TransactionRecord,
  TransactionsRepository,
} from '@/modules/finance/application/ports/transactions-repository'
import { TransactionType as DomainTransactionType } from '@/modules/finance/domain/entities/transaction'

export class InMemoryTransactionsRepository implements TransactionsRepository {
  public records: TransactionRecord[] = []
  public transactions: Transaction[] = []

  async create(
    data: CreateTransactionInput,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _ctx?: Prisma.TransactionClient,
  ): Promise<TransactionRecord> {
    const now = new Date()
    const amount = Money.from(data.amount.toNumber())
    const type: TransactionRecord['type'] = amount.isNegative()
      ? DomainTransactionType.WITHDRAWAL
      : DomainTransactionType.ADDITION

    const record: TransactionRecord = {
      id: randomUUID(),
      amount,
      reason: data.reason,
      description: data.description ?? null,
      createdAt: now,
      type,
      isLoan: data.isLoan ?? false,
      userId: data.userId,
      affectedUserId: data.affectedUserId ?? null,
      saleId: data.saleId ?? null,
      saleItemId: data.saleItemId ?? null,
      sessionId: data.sessionId ?? null,
      unitId: data.unitId ?? null,
      loanId: data.loanId ?? null,
      appointmentServiceId: data.appointmentServiceId ?? null,
      receiptUrl: data.receiptUrl ?? null,
    }

    this.records.push(record)
    this.transactions.push(this.toPrismaTransaction(record))

    return record
  }

  async findManyByUser(
    userId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _ctx?: Prisma.TransactionClient,
  ): Promise<TransactionRecord[]> {
    return this.records.filter((record) => record.userId === userId)
  }

  async findManyBySession(
    sessionId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _ctx?: Prisma.TransactionClient,
  ): Promise<TransactionRecord[]> {
    return this.records.filter((record) => record.sessionId === sessionId)
  }

  private toPrismaTransaction(record: TransactionRecord): Transaction {
    return {
      id: record.id,
      userId: record.userId,
      affectedUserId: record.affectedUserId ?? null,
      unitId: record.unitId ?? 'unit-unknown',
      cashRegisterSessionId: record.sessionId ?? null,
      type:
        record.type === 'WITHDRAWAL'
          ? TransactionType.WITHDRAWAL
          : TransactionType.ADDITION,
      description: record.description ?? '',
      amount: record.amount.abs().toNumber(),
      isLoan: record.isLoan,
      receiptUrl: record.receiptUrl ?? null,
      createdAt: record.createdAt,
      reason: record.reason as ReasonTransaction,
      saleId: record.saleId ?? null,
      saleItemId: record.saleItemId ?? null,
      appointmentServiceId: record.appointmentServiceId ?? null,
      loanId: record.loanId ?? null,
    }
  }
}
