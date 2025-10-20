import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PayUserLoansService } from '../../../src/services/loan/pay-user-loans'
import { CreateTransactionService } from '../../../src/services/transaction/create-transaction'
import {
  FakeLoanRepository,
  FakeUnitRepository,
  FakeTransactionRepository,
  FakeBarberUsersRepository,
  FakeCashRegisterRepository,
} from '../../helpers/fake-repositories'
import { LoanStatus, TransactionType } from '@prisma/client'
import {
  makeProfile,
  makeUser,
  defaultUnit,
  makeCashSession,
} from '../../helpers/default-values'

let loanRepo: FakeLoanRepository
let unitRepo: FakeUnitRepository
let txRepo: FakeTransactionRepository
let barberRepo: FakeBarberUsersRepository
let cashRepo: FakeCashRegisterRepository
let service: PayUserLoansService
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
  service = new PayUserLoansService(loanRepo, unitRepo)
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
      ? [{ amount: paid, type: TransactionType.ADDITION } as any]
      : [],
  }
}

describe('Pay user loans service', () => {
  beforeEach(() => {
    setup()
  })

  it('pays loans using available amount', async () => {
    loanRepo.loans.push(makeLoan('l1', 50), makeLoan('l2', 30))

    const res = await service.execute({ affectedUser: user, amount: 60 })

    expect(res.totalPaid).toBe(60)
    expect(res.remaining).toBe(0)
    expect(txRepo.transactions).toHaveLength(2)
    expect(unitRepo.unit.totalBalance).toBe(60)
    const [loan1, loan2] = loanRepo.loans
    expect(loan1.status).toBe(LoanStatus.PAID_OFF)
    expect(loan2.status).toBe(LoanStatus.VALUE_TRANSFERRED)
  })

  it('returns remaining amount when payment exceeds debts', async () => {
    loanRepo.loans.push(makeLoan('l1', 40))

    const res = await service.execute({ affectedUser: user, amount: 60 })

    expect(res.totalPaid).toBe(40)
    expect(res.remaining).toBe(20)
    expect(txRepo.transactions).toHaveLength(1)
    expect(unitRepo.unit.totalBalance).toBe(40)
    expect(loanRepo.loans[0].status).toBe(LoanStatus.PAID_OFF)
  })
})
