import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PayUserLoansUseCase } from '../../../src/modules/finance/application/use-cases/pay-user-loans'
import { CreateTransactionService } from '../../../src/services/transaction/create-transaction'
import {
  FakeLoanRepository,
  FakeUnitRepository,
  FakeTransactionRepository,
  FakeBarberUsersRepository,
  FakeCashRegisterRepository,
} from '../../helpers/fake-repositories'
import { LoanStatus, TransactionType, Prisma } from '@prisma/client'
import {
  makeProfile,
  makeUser,
  defaultUnit,
  makeCashSession,
} from '../../helpers/default-values'
import {
  LoansRepositoryPort,
  LoanRecord,
  LoanWithTransactionsRecord,
  LoanQueryFilters,
  LoanUpdateData,
  CreateLoanInput,
} from '../../../src/modules/finance/application/ports/loans-repository'
import { LoanWithTransactions } from '../../../src/repositories/loan-repository'
import { Money } from '../../../src/core/domain/value-objects/money'
import { IncrementBalanceUnitService } from '../../../src/services/unit/increment-balance'

let loanRepo: FakeLoanRepository
let unitRepo: FakeUnitRepository
let txRepo: FakeTransactionRepository
let barberRepo: FakeBarberUsersRepository
let cashRepo: FakeCashRegisterRepository
let useCase: PayUserLoansUseCase
let user: ReturnType<typeof makeUser>

vi.mock(
  '../../../src/services/@factories/transaction/make-create-transaction',
  () => ({
    makeCreateTransaction: () =>
      new CreateTransactionService(txRepo, barberRepo, cashRepo),
  }),
)

function setup() {
  txRepo = new FakeTransactionRepository()
  loanRepo = new FakeLoanRepository()
  unitRepo = new FakeUnitRepository({ ...defaultUnit, totalBalance: 0 })
  barberRepo = new FakeBarberUsersRepository()
  cashRepo = new FakeCashRegisterRepository()
  const profile = makeProfile('p1', 'u1')
  const unit = unitRepo.unit
  user = makeUser('u1', profile, unit)
  barberRepo.users.push(user)
  cashRepo.session = { ...makeCashSession('s1', unit.id), user }

  const loansPort = new LoansRepositoryAdapter(loanRepo)
  const incrementUnitService = new IncrementBalanceUnitService(unitRepo)
  useCase = new PayUserLoansUseCase(loansPort, incrementUnitService)
}

function makeLoan(id: string, amount: number, paid = 0) {
  return {
    id,
    userId: user.id,
    unitId: user.unitId,
    sessionId: 's1',
    amount,
    status: LoanStatus.VALUE_TRANSFERRED,
    createdAt: new Date('2024-01-01'),
    paidAt: null,
    updatedById: null,
    transactions: paid
      ? [
          {
            id: `${id}-tx`,
            amount: paid,
            type: TransactionType.ADDITION,
          } as any,
        ]
      : [],
  }
}

describe('Pay user loans', () => {
  beforeEach(() => {
    setup()
  })

  it('paga empréstimos conforme saldo disponível', async () => {
    loanRepo.loans.push(makeLoan('l1', 50), makeLoan('l2', 30))

    const res = await useCase.execute({
      affectedUser: user,
      amount: Money.from(60),
    })

    expect(res.totalPaid.toNumber()).toBe(60)
    expect(res.remaining.toNumber()).toBe(0)
    expect(txRepo.transactions).toHaveLength(2)
    expect(unitRepo.unit.totalBalance).toBe(60)
    const [loan1, loan2] = loanRepo.loans
    expect(loan1.status).toBe(LoanStatus.PAID_OFF)
    expect(loan2.status).toBe(LoanStatus.VALUE_TRANSFERRED)
  })

  it('retorna restante quando pagamento excede dívidas', async () => {
    loanRepo.loans.push(makeLoan('l1', 40))

    const res = await useCase.execute({
      affectedUser: user,
      amount: Money.from(60),
    })

    expect(res.totalPaid.toNumber()).toBe(40)
    expect(res.remaining.toNumber()).toBe(20)
    expect(txRepo.transactions).toHaveLength(1)
    expect(unitRepo.unit.totalBalance).toBe(40)
    expect(loanRepo.loans[0].status).toBe(LoanStatus.PAID_OFF)
  })
})

class LoansRepositoryAdapter implements LoansRepositoryPort {
  constructor(private readonly repo: FakeLoanRepository) {}

  async create(
    _data: CreateLoanInput,
    _ctx?: Prisma.TransactionClient,
  ): Promise<LoanRecord> {
    return Promise.reject(new Error('not implemented'))
  }

  async findById(
    id: string,
    _ctx?: Prisma.TransactionClient,
  ): Promise<LoanWithTransactionsRecord | null> {
    const loan = await this.repo.findById(id)
    return loan ? convertLoan(loan) : null
  }

  async findMany(
    filters: LoanQueryFilters = {},
    _ctx?: Prisma.TransactionClient,
  ): Promise<LoanWithTransactionsRecord[]> {
    const where: Prisma.LoanWhereInput = {
      userId: filters.userId ? { equals: filters.userId } : undefined,
      unitId: filters.unitId ? { equals: filters.unitId } : undefined,
      status: filters.status ? { equals: filters.status as any } : undefined,
    }
    const loans = await this.repo.findMany(where)
    return loans.map(convertLoan)
  }

  async update(
    id: string,
    data: LoanUpdateData,
    _ctx?: Prisma.TransactionClient,
  ): Promise<LoanRecord> {
    const updated = await this.repo.update(id, {
      status: data.status as any,
      paidAt: data.paidAt ?? undefined,
      updatedById: data.updatedById ?? undefined,
    })
    return toLoanRecord(updated)
  }
}

function convertLoan(loan: LoanWithTransactions): LoanWithTransactionsRecord {
  return {
    id: loan.id,
    unitId: loan.unitId,
    userId: loan.userId,
    sessionId: loan.sessionId,
    amount: Money.from(loan.amount),
    status: loan.status as LoanStatus,
    createdAt: loan.createdAt,
    paidAt: loan.paidAt,
    updatedById: loan.updatedById ?? null,
    transactions: loan.transactions.map((tx) => ({
      id: tx.id,
      amount: Money.from(tx.amount),
      createdAt: tx.createdAt,
    })),
  }
}

function toLoanRecord(loan: LoanWithTransactions): LoanRecord {
  return {
    id: loan.id,
    unitId: loan.unitId,
    userId: loan.userId,
    sessionId: loan.sessionId,
    amount: Money.from(loan.amount),
    status: loan.status as LoanStatus,
    createdAt: loan.createdAt,
    paidAt: loan.paidAt,
    updatedById: loan.updatedById ?? null,
  }
}
