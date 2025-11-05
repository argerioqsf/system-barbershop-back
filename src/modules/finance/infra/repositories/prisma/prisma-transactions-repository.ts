import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import {
  TransactionsRepository,
  CreateTransactionInput,
  TransactionRecord,
} from '@/modules/finance/application/ports/transactions-repository'
import { TransactionMapper } from '@/modules/finance/infra/mappers/transaction-mapper'
import { UnitRequiredForTransactionError } from '@/modules/finance/application/errors/unit-required-for-transaction-error'
import {
  Transaction,
  TransactionType,
} from '@/modules/finance/domain/entities/transaction'

type PrismaTransaction = Prisma.TransactionGetPayload<object>

export class PrismaTransactionsRepository implements TransactionsRepository {
  constructor(private readonly client = prisma) {}

  async create(
    data: CreateTransactionInput,
    ctx?: Prisma.TransactionClient,
  ): Promise<TransactionRecord> {
    const prismaClient = ctx ?? this.client

    const transactionDomain = Transaction.create({
      amount: data.amount,
      reason: data.reason,
      description: data.description,
      userId: data.userId,
      affectedUserId: data.affectedUserId,
      saleId: data.saleId,
      sessionId: data.sessionId,
      unitId: data.unitId,
      loanId: data.loanId,
      appointmentServiceId: data.appointmentServiceId,
      receiptUrl: data.receiptUrl,
    })

    const prismaData = TransactionMapper.toPrismaData(transactionDomain, {
      isLoan: data.isLoan,
    })

    if (!prismaData.unitId) {
      throw new UnitRequiredForTransactionError()
    }

    const dataToPersist: Prisma.TransactionUncheckedCreateInput = {
      userId: prismaData.userId,
      affectedUserId: prismaData.affectedUserId ?? undefined,
      unitId: prismaData.unitId,
      cashRegisterSessionId: prismaData.cashRegisterSessionId ?? undefined,
      type: prismaData.type,
      description: prismaData.description,
      amount: prismaData.amount,
      isLoan: prismaData.isLoan,
      receiptUrl: prismaData.receiptUrl,
      reason: prismaData.reason,
      saleId: prismaData.saleId ?? undefined,
      saleItemId: prismaData.saleItemId ?? undefined,
      appointmentServiceId: prismaData.appointmentServiceId ?? undefined,
      loanId: prismaData.loanId ?? undefined,
    }

    const created = await prismaClient.transaction.create({
      data: dataToPersist,
    })

    return this.toRecord(created)
  }

  async findManyByUser(
    userId: string,
    ctx?: Prisma.TransactionClient,
  ): Promise<TransactionRecord[]> {
    const prismaClient = ctx ?? this.client
    const transactions = await prismaClient.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return transactions.map((transaction) => this.toRecord(transaction))
  }

  async findManyBySession(
    sessionId: string,
    ctx?: Prisma.TransactionClient,
  ): Promise<TransactionRecord[]> {
    const prismaClient = ctx ?? this.client
    const transactions = await prismaClient.transaction.findMany({
      where: { cashRegisterSessionId: sessionId },
      orderBy: { createdAt: 'desc' },
    })

    return transactions.map((transaction) => this.toRecord(transaction))
  }

  private toRecord(transaction: PrismaTransaction): TransactionRecord {
    const domain = TransactionMapper.toDomain(transaction)
    const snapshot = domain.toObject()

    return {
      id: snapshot.id ?? transaction.id,
      amount: snapshot.amount,
      reason: snapshot.reason,
      description: snapshot.description,
      createdAt: snapshot.createdAt,
      type:
        transaction.type === TransactionType.WITHDRAWAL
          ? TransactionType.WITHDRAWAL
          : TransactionType.ADDITION,
      isLoan: transaction.isLoan,
      userId: snapshot.userId,
      affectedUserId: snapshot.affectedUserId,
      saleId: snapshot.saleId,
      saleItemId: snapshot.saleItemId,
      sessionId: snapshot.sessionId,
      unitId: snapshot.unitId,
      loanId: snapshot.loanId,
      appointmentServiceId: snapshot.appointmentServiceId,
      receiptUrl: snapshot.receiptUrl,
    }
  }
}
