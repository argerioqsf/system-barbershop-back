import { describe, expect, it } from 'vitest'
import { UpdateLoanStatusUseCase } from '../../../../../src/modules/finance/application/use-cases/update-loan-status'
import {
  CreateLoanInput,
  LoanRecord,
  LoansRepositoryPort,
  LoanWithTransactionsRecord,
} from '../../../../../src/modules/finance/application/ports/loans-repository'
import { LoanStatus } from '../../../../../src/modules/finance/domain/types/status'
import { Money } from '../../../../../src/core/domain/value-objects/money'
import { IncrementBalanceUnitService } from '../../../../../src/services/unit/increment-balance'

class InMemoryLoansRepository implements LoansRepositoryPort {
  constructor(private loan: LoanWithTransactionsRecord) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async create(data: CreateLoanInput, ctx?: any) {
    return {} as LoanRecord
  }

  async findById() {
    return this.loan
  }

  async findMany() {
    return [this.loan]
  }

  async update(
    id: string,
    data: { status?: LoanStatus; paidAt?: Date | null },
  ) {
    this.loan = {
      ...this.loan,
      status: data.status ?? this.loan.status,
      paidAt: data.paidAt ?? this.loan.paidAt,
    }

    return this.loan
  }
}

class StubIncrementBalanceUnitService extends IncrementBalanceUnitService {
  public calls = 0
  public lastAmount = 0

  constructor() {
    super({} as any)
  }

  async execute(
    id: string,
    userId: string,
    amount: number,
    options: any,
    saleId?: string,
    isLoan?: boolean,
    loanId?: string,
    description?: string,
  ): Promise<{ unit: null; transaction: any }> {
    this.calls += 1
    this.lastAmount = amount
    return { unit: null, transaction: { id: 'unit-tx' } }
  }
}

describe('UpdateLoanStatusUseCase', () => {
  it('emits transaction when status becomes VALUE_TRANSFERRED', async () => {
    const loanRecord: LoanWithTransactionsRecord = {
      id: 'loan-1',
      unitId: 'unit-1',
      userId: 'user-1',
      sessionId: 'session-1',
      amount: Money.from(80),
      status: LoanStatus.PENDING,
      createdAt: new Date(),
      paidAt: null,
      updatedById: null,
      transactions: [],
    }

    const loansRepository = new InMemoryLoansRepository(loanRecord)
    const incrementUnit = new StubIncrementBalanceUnitService()

    const useCase = new UpdateLoanStatusUseCase(loansRepository, incrementUnit)

    const result = await useCase.execute({
      loanId: 'loan-1',
      status: LoanStatus.VALUE_TRANSFERRED,
      updatedById: 'user-manager',
    })

    expect(result.transactions).toHaveLength(1)
    expect(incrementUnit.calls).toBe(1)
    expect(incrementUnit.lastAmount).toBe(-80)
    expect(result.loan.status).toBe(LoanStatus.VALUE_TRANSFERRED)
    expect(result.loan.amount.toNumber()).toBe(80)
  })

  it('keeps silent when status does not require transfer', async () => {
    const loanRecord: LoanWithTransactionsRecord = {
      id: 'loan-1',
      unitId: 'unit-1',
      userId: 'user-1',
      sessionId: 'session-1',
      amount: Money.from(80),
      status: LoanStatus.PENDING,
      createdAt: new Date(),
      paidAt: null,
      updatedById: null,
      transactions: [],
    }

    const loansRepository = new InMemoryLoansRepository(loanRecord)
    const incrementUnit = new StubIncrementBalanceUnitService()

    const useCase = new UpdateLoanStatusUseCase(loansRepository, incrementUnit)

    const result = await useCase.execute({
      loanId: 'loan-1',
      status: LoanStatus.APPROVED,
      updatedById: 'user-manager',
    })

    expect(result.transactions).toHaveLength(0)
    expect(incrementUnit.calls).toBe(0)
    expect(result.loan.status).toBe(LoanStatus.APPROVED)
  })
})
