import {
  CreateTransactionInput,
  TransactionRecord,
  PortTransactionType,
  TransactionsRepository,
} from '../../src/modules/finance/application/ports/transactions-repository'
import { InMemoryTransactionRepository } from '../../src/repositories/in-memory/in-memory-transaction-repository'
import { Prisma, Transaction, TransactionType } from '@prisma/client'
import { TransactionFull } from '../../src/repositories/prisma/prisma-transaction-repository'

type LegacyCreateInput = Prisma.TransactionCreateInput & {
  saleItemId?: string | null
  appointmentServiceId?: string | null
  loanId?: string | null
}

function isCreateTransactionInput(
  data: CreateTransactionInput | LegacyCreateInput,
): data is CreateTransactionInput {
  const maybeMoney = (data as CreateTransactionInput).amount
  return (
    typeof maybeMoney === 'object' &&
    maybeMoney !== null &&
    typeof maybeMoney.toNumber === 'function'
  )
}

export class CompatFakeTransactionRepository implements TransactionsRepository {
  private readonly legacy = new InMemoryTransactionRepository()
  private readonly records: TransactionRecord[] = []

  // TODO: remover após migrar todos os consumidores para o novo port
  // Mantemos compatibilidade com o repositório legado porque vários testes/serviços
  // ainda dependem de métodos antigos (`findMany`, `findManyByAffectedUser`, etc.).
  // Quando esses fluxos forem reimplementados sobre os novos casos de uso/queries
  // de Finance, podemos eliminar este adaptador e usar apenas o port moderno.

  get transactions(): TransactionFull[] {
    return this.legacy.transactions
  }

  set transactions(value: TransactionFull[]) {
    this.legacy.transactions = value
  }

  async create(
    data: CreateTransactionInput,
    _ctx?: Prisma.TransactionClient,
  ): Promise<TransactionRecord>

  async create(data: LegacyCreateInput): Promise<Transaction>
  async create(
    data: CreateTransactionInput | LegacyCreateInput,
    _ctx?: Prisma.TransactionClient,
  ): Promise<TransactionRecord | Transaction> {
    if (isCreateTransactionInput(data)) {
      if (!data.unitId) {
        throw new Error(
          'CompatFakeTransactionRepository requires unitId for creation',
        )
      }

      const type: PortTransactionType = data.amount.isNegative()
        ? 'WITHDRAWAL'
        : 'ADDITION'

      const legacyInput: LegacyCreateInput = {
        type:
          type === 'WITHDRAWAL'
            ? TransactionType.WITHDRAWAL
            : TransactionType.ADDITION,
        description: data.description ?? '',
        amount: data.amount.abs().toNumber(),
        isLoan: data.isLoan ?? false,
        receiptUrl: data.receiptUrl ?? null,
        reason: data.reason,
        user: { connect: { id: data.userId } },
        unit: { connect: { id: data.unitId } },
        session: data.sessionId
          ? { connect: { id: data.sessionId } }
          : undefined,
        affectedUser: data.affectedUserId
          ? { connect: { id: data.affectedUserId } }
          : undefined,
        sale: data.saleId ? { connect: { id: data.saleId } } : undefined,
        saleItem: data.saleItemId
          ? { connect: { id: data.saleItemId } }
          : undefined,
        appointmentService: data.appointmentServiceId
          ? { connect: { id: data.appointmentServiceId } }
          : undefined,
        loan: data.loanId ? { connect: { id: data.loanId } } : undefined,
      }

      const created = await this.legacy.create(legacyInput)

      const record: TransactionRecord = {
        id: created.id,
        amount: data.amount,
        reason: data.reason,
        description: data.description ?? null,
        createdAt: created.createdAt,
        type,
        isLoan: data.isLoan ?? false,
        userId: data.userId,
        affectedUserId: data.affectedUserId ?? null,
        saleId: data.saleId ?? null,
        saleItemId: data.saleItemId ?? null,
        sessionId: data.sessionId ?? null,
        unitId: data.unitId,
        loanId: data.loanId ?? null,
        appointmentServiceId: data.appointmentServiceId ?? null,
        receiptUrl: data.receiptUrl ?? null,
      }

      this.records.push(record)
      return record
    }

    return this.legacy.create(data as LegacyCreateInput)
  }

  async findManyByUser(
    userId: string,
    _ctx?: Prisma.TransactionClient,
  ): Promise<any> {
    const result = this.records.filter((record) => record.userId === userId)
    return Promise.resolve(result)
  }

  async findManyBySession(
    sessionId: string,
    _ctx?: Prisma.TransactionClient,
  ): Promise<any> {
    const result = this.records.filter(
      (record) => record.sessionId === sessionId,
    )
    return Promise.resolve(result)
  }

  async findMany(
    where?: Prisma.TransactionWhereInput,
    pagination?: { page: number; perPage: number },
  ) {
    return this.legacy.findMany(where, pagination)
  }

  async findManyByAffectedUser(affectedUserId: string) {
    return this.legacy.findManyByAffectedUser(affectedUserId)
  }

  async delete(id: string): Promise<void> {
    await this.legacy.delete(id)
    const index = this.records.findIndex((record) => record.id === id)
    if (index >= 0) {
      this.records.splice(index, 1)
    }
  }

  get transactionRecords(): TransactionRecord[] {
    return this.records
  }
}
