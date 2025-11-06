import { describe, it, expect, beforeEach } from 'vitest'
import { PayLoanUseCase } from '../../../../../src/modules/finance/application/use-cases/pay-loan'
import { Money } from '../../../../../src/core/domain/value-objects/money'
import {
  CreateLoanInput,
  LoanRecord,
  LoansRepositoryPort,
  LoanWithTransactionsRecord,
} from '../../../../../src/modules/finance/application/ports/loans-repository'
import { LoanStatus } from '../../../../../src/modules/finance/domain/types/status'
import { IncrementBalanceProfileService } from '../../../../../src/services/profile/increment-balance'
import { IncrementBalanceUnitService } from '../../../../../src/services/unit/increment-balance'
import { InsufficientBalanceError } from '../../../../../src/services/@errors/transaction/insufficient-balance-error'
import { LoanPaymentGreaterThanRemainingError } from '../../../../../src/services/@errors/loan/loan-payment-greater-than-remaining-error'
import { NegativeValuesNotAllowedError } from '../../../../../src/modules/finance/application/errors/negative-values-not-allowed-error'
import { LoanNotFoundError } from '../../../../../src/modules/finance/application/errors/loan-not-found-error'

class InMemoryLoansRepository implements LoansRepositoryPort {
  public loans = new Map<string, LoanWithTransactionsRecord>()

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async create(data: CreateLoanInput, ctx?: any) {
    return {} as LoanRecord
  }

  async findById(id: string) {
    return this.loans.get(id) ?? null
  }

  async findMany() {
    return Array.from(this.loans.values())
  }

  async update(
    id: string,
    data: { status?: LoanStatus; paidAt?: Date | null },
  ) {
    const loan = this.loans.get(id)
    if (!loan) {
      throw new LoanNotFoundError()
    }

    const updated = {
      ...loan,
      status: data.status ?? loan.status,
      paidAt: data.paidAt ?? loan.paidAt,
    }

    this.loans.set(id, updated)
    return updated
  }
}

class StubIncrementBalanceProfileService extends IncrementBalanceProfileService {
  public amount = Money.zero()
  public calls = 0

  constructor() {
    super({} as any)
  }

  async execute(
    affectedUserId: string,
    amount: number,
    options: any,
    saleId?: string,
    isLoan?: boolean,
    description?: string,
    saleItemId?: string,
    appointmentServiceId?: string,
    loanId?: string,
  ): Promise<{ profile: null; transaction: any }> {
    this.calls += 1
    this.amount = this.amount.add(Money.from(amount))
    return { profile: null, transaction: { id: `profile-${this.calls}` } }
  }
}

class StubIncrementBalanceUnitService extends IncrementBalanceUnitService {
  public amount = Money.zero()
  public calls = 0

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
    this.amount = this.amount.add(Money.from(amount))
    return { unit: null, transaction: { id: `unit-${this.calls}` } }
  }
}

describe('PayLoanUseCase', () => {
  let loansRepository: InMemoryLoansRepository
  let incrementProfile: StubIncrementBalanceProfileService
  let incrementUnit: StubIncrementBalanceUnitService
  let useCase: PayLoanUseCase

  beforeEach(() => {
    loansRepository = new InMemoryLoansRepository()
    incrementProfile = new StubIncrementBalanceProfileService()
    incrementUnit = new StubIncrementBalanceUnitService()

    useCase = new PayLoanUseCase(
      loansRepository,
      {
        findById: async () => ({
          id: 'user-1',
          profile: { totalBalance: 100 },
        }),
      } as any,
      incrementProfile,
      incrementUnit,
    )

    loansRepository.loans.set('loan-1', {
      id: 'loan-1',
      unitId: 'unit-1',
      userId: 'user-1',
      sessionId: 'session-1',
      amount: Money.from(50),
      status: LoanStatus.VALUE_TRANSFERRED,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      paidAt: null,
      updatedById: null,
      transactions: [],
    })
  })

  it('pays part of a loan and updates remaining balance', async () => {
    const result = await useCase.execute({
      loanId: 'loan-1',
      amount: Money.from(20),
      actorId: 'actor-1',
    })

    expect(result.transactions).toHaveLength(2)
    expect(result.remaining.toNumber()).toBe(30)
    expect(incrementProfile.amount.toNumber()).toBe(-20)
    expect(incrementUnit.amount.toNumber()).toBe(20)
  })

  it('marks loan as paid off when remaining is zero', async () => {
    const result = await useCase.execute({
      loanId: 'loan-1',
      amount: Money.from(50),
      actorId: 'actor-1',
    })

    expect(result.remaining.toNumber()).toBe(0)
    const updatedLoan = loansRepository.loans.get('loan-1')
    expect(updatedLoan?.status).toBe(LoanStatus.PAID_OFF)
    expect(updatedLoan?.paidAt).not.toBeNull()
  })

  it('throws when amount is not positive', async () => {
    await expect(
      useCase.execute({
        loanId: 'loan-1',
        amount: Money.zero(),
        actorId: 'actor-1',
      }),
    ).rejects.toBeInstanceOf(NegativeValuesNotAllowedError)
  })

  it('throws when paying more than remaining', async () => {
    await expect(
      useCase.execute({
        loanId: 'loan-1',
        amount: Money.from(60),
        actorId: 'actor-1',
      }),
    ).rejects.toBeInstanceOf(LoanPaymentGreaterThanRemainingError)
  })

  it('throws when user balance is insufficient', async () => {
    useCase = new PayLoanUseCase(
      loansRepository,
      {
        findById: async () => ({
          id: 'user-1',
          profile: { totalBalance: 10 },
        }),
      } as any,
      incrementProfile,
      incrementUnit,
    )

    await expect(
      useCase.execute({
        loanId: 'loan-1',
        amount: Money.from(20),
        actorId: 'actor-1',
      }),
    ).rejects.toBeInstanceOf(InsufficientBalanceError)
  })
})
