import { describe, expect, it, vi } from 'vitest'
import { Prisma } from '@prisma/client'
import { PrismaTransactionsRepository } from '../../../../../src/modules/finance/infra/repositories/prisma/prisma-transactions-repository'
import { Money } from '../../../../../src/core/domain/value-objects/money'
import {
  TransactionReason,
  TransactionType,
} from '../../../../../src/modules/finance/domain/entities/transaction'

describe('PrismaTransactionsRepository', () => {
  it('creates a transaction using domain invariants and mapper', async () => {
    const createdAt = new Date('2024-01-01T12:00:00Z')

    const createMock = vi.fn(async ({ data }) => {
      expect(data).toMatchObject({
        userId: 'user-1',
        unitId: 'unit-1',
        amount: 100,
        reason: TransactionReason.PAY_COMMISSION,
        cashRegisterSessionId: 'session-1',
        description: 'Commission payment',
      })

      return {
        id: 'tx-1',
        userId: data.userId,
        affectedUserId: data.affectedUserId ?? null,
        unitId: data.unitId,
        cashRegisterSessionId: data.cashRegisterSessionId ?? null,
        type: data.type,
        description: data.description,
        amount: data.amount,
        isLoan: data.isLoan ?? false,
        receiptUrl: data.receiptUrl ?? null,
        createdAt,
        reason: data.reason,
        saleId: data.saleId ?? null,
        saleItemId: data.saleItemId ?? null,
        appointmentServiceId: data.appointmentServiceId ?? null,
        loanId: data.loanId ?? null,
      }
    })

    const repository = new PrismaTransactionsRepository({
      transaction: {
        create: createMock,
        findMany: vi.fn(),
      },
    } as unknown as Prisma.TransactionClient)

    const transaction = await repository.create({
      amount: Money.from(100),
      reason: TransactionReason.PAY_COMMISSION,
      description: 'Commission payment',
      userId: 'user-1',
      unitId: 'unit-1',
      sessionId: 'session-1',
    })

    expect(transaction.id).toBe('tx-1')
    expect(transaction.amount.equals(Money.from(100))).toBe(true)
    expect(transaction.reason).toBe(TransactionReason.PAY_COMMISSION)
    expect(transaction.unitId).toBe('unit-1')
    expect(transaction.sessionId).toBe('session-1')
    expect(transaction.createdAt).toEqual(createdAt)
  })

  it('maps withdrawal transactions to negative amounts when reading', async () => {
    const findManyMock = vi.fn(async () => [
      {
        id: 'tx-withdraw',
        userId: 'user-1',
        affectedUserId: null,
        unitId: 'unit-1',
        cashRegisterSessionId: 'session-1',
        type: TransactionType.WITHDRAWAL,
        description: 'Cash withdrawal',
        amount: 50,
        isLoan: false,
        receiptUrl: null,
        createdAt: new Date('2024-02-01T10:00:00Z'),
        reason: TransactionReason.OTHER,
        saleId: null,
        saleItemId: null,
        appointmentServiceId: null,
        loanId: null,
      },
    ])

    const repository = new PrismaTransactionsRepository({
      transaction: {
        create: vi.fn(),
        findMany: findManyMock,
      },
    } as unknown as Prisma.TransactionClient)

    const transactions = await repository.findManyBySession('session-1')

    expect(findManyMock).toHaveBeenCalledWith({
      where: { cashRegisterSessionId: 'session-1' },
      orderBy: { createdAt: 'desc' },
    })
    expect(transactions).toHaveLength(1)
    expect(transactions[0].amount.toNumber()).toBe(-50)
    expect(transactions[0].type).toBe(TransactionType.WITHDRAWAL)
  })
})
