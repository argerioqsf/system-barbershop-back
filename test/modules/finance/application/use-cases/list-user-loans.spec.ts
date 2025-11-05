import { describe, expect, it } from 'vitest'
import { ListUserLoansUseCase } from '../../../../../src/modules/finance/application/use-cases/list-user-loans'
import { Money } from '../../../../../src/core/domain/value-objects/money'
import {
  CreateLoanInput,
  LoanRecord,
  LoansRepositoryPort,
  LoanUpdateData,
  LoanWithTransactionsRecord,
} from '../../../../../src/modules/finance/application/ports/loans-repository'
import { LoanStatus } from '../../../../../src/modules/finance/domain/types/status'

class InMemoryLoansRepository implements LoansRepositoryPort {
  constructor(private readonly loans: LoanWithTransactionsRecord[]) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async create(data: CreateLoanInput, ctx?: any) {
    return {} as LoanRecord
  }

  async findById() {
    return null
  }

  async findMany({ userId }: { userId?: string }) {
    return this.loans.filter((loan) => loan.userId === userId)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async update(id: string, data: LoanUpdateData, ctx?: any) {
    return Promise.resolve({} as LoanRecord)
  }
}

describe('ListUserLoansUseCase', () => {
  it('calculates pending, paid and total owed amounts', async () => {
    const repo = new InMemoryLoansRepository([
      {
        id: 'loan-1',
        unitId: 'unit-1',
        userId: 'user-1',
        sessionId: 'session-1',
        amount: Money.from(100),
        status: LoanStatus.VALUE_TRANSFERRED,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        paidAt: null,
        updatedById: null,
        transactions: [
          {
            id: 'tx-1',
            amount: Money.from(40),
            createdAt: new Date('2024-01-02T00:00:00Z'),
          },
        ],
      },
      {
        id: 'loan-2',
        unitId: 'unit-1',
        userId: 'user-1',
        sessionId: 'session-1',
        amount: Money.from(50),
        status: LoanStatus.PAID_OFF,
        createdAt: new Date('2024-01-03T00:00:00Z'),
        paidAt: new Date('2024-01-05T00:00:00Z'),
        updatedById: null,
        transactions: [
          {
            id: 'tx-2',
            amount: Money.from(50),
            createdAt: new Date('2024-01-04T00:00:00Z'),
          },
        ],
      },
    ])

    const useCase = new ListUserLoansUseCase(repo)

    const summary = await useCase.execute('user-1')

    expect(summary.pending).toHaveLength(1)
    expect(summary.pending[0].remaining.toNumber()).toBe(60)

    expect(summary.paid).toHaveLength(1)
    expect(summary.paid[0].amount.toNumber()).toBe(50)

    expect(summary.totalOwed.toNumber()).toBe(60)
  })
})
