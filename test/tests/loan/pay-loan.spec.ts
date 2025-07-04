import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PayLoanService } from '../../../src/services/loan/pay-loan'
import { CreateTransactionService } from '../../../src/services/transaction/create-transaction'
import {
  FakeLoanRepository,
  FakeProfilesRepository,
  FakeUnitRepository,
  FakeTransactionRepository,
  FakeBarberUsersRepository,
  FakeCashRegisterRepository,
} from '../../helpers/fake-repositories'
import { makeProfile, makeUser, defaultUnit, makeCashSession } from '../../helpers/default-values'
import { LoanStatus, TransactionType } from '@prisma/client'
import { NegativeValuesNotAllowedError } from '../../../src/services/@errors/transaction/negative-values-not-allowed-error'
import { InsufficientBalanceError } from '../../../src/services/@errors/transaction/insufficient-balance-error'
import { LoanPaymentGreaterThanRemainingError } from '../../../src/services/@errors/loan/loan-payment-greater-than-remaining-error'

let loanRepo: FakeLoanRepository
let profileRepo: FakeProfilesRepository
let unitRepo: FakeUnitRepository
let txRepo: FakeTransactionRepository
let barberRepo: FakeBarberUsersRepository
let cashRepo: FakeCashRegisterRepository
let service: PayLoanService
let user: ReturnType<typeof makeUser>

vi.mock('../../../src/services/@factories/transaction/make-create-transaction', () => ({
  makeCreateTransaction: () => new CreateTransactionService(txRepo, barberRepo, cashRepo),
}))

function setup(balance = 100) {
  txRepo = new FakeTransactionRepository()
  loanRepo = new FakeLoanRepository()
  profileRepo = new FakeProfilesRepository()
  unitRepo = new FakeUnitRepository({ ...defaultUnit, totalBalance: 0 })
  barberRepo = new FakeBarberUsersRepository()
  cashRepo = new FakeCashRegisterRepository()
  const profile = makeProfile('p1', 'u1', balance)
  profileRepo.profiles.push(profile)
  const unit = unitRepo.unit
  user = makeUser('u1', profile, unit)
  barberRepo.users.push(user)
  cashRepo.session = { ...makeCashSession('s1', unit.id), user }
  service = new PayLoanService(loanRepo, profileRepo, barberRepo, unitRepo)
}

function makeLoan(id: string, amount: number, paid = 0) {
  return {
    id,
    userId: user.id,
    unitId: user.unitId,
    sessionId: 's1',
    amount,
    status: LoanStatus.PAID,
    createdAt: new Date('2024-01-01'),
    paidAt: null,
    fullyPaid: false,
    updatedById: null,
    transactions: paid ? [{ amount: paid, type: TransactionType.ADDITION } as any] : [],
  }
}

describe('Pay loan service', () => {
  beforeEach(() => {
    setup()
  })

  it('pays part of a loan', async () => {
    loanRepo.loans.push(makeLoan('l1', 50))

    const res = await service.execute({ loanId: 'l1', amount: 30 })

    expect(res.remaining).toBe(20)
    expect(profileRepo.profiles[0].totalBalance).toBe(70)
    expect(unitRepo.unit.totalBalance).toBe(30)
    expect(txRepo.transactions).toHaveLength(2)
    expect(loanRepo.loans[0].fullyPaid).toBe(false)
  })

  it('marks loan as fully paid when remaining amount is paid', async () => {
    loanRepo.loans.push(makeLoan('l1', 40))

    const res = await service.execute({ loanId: 'l1', amount: 40 })

    expect(res.remaining).toBe(0)
    expect(loanRepo.loans[0].fullyPaid).toBe(true)
    expect(txRepo.transactions).toHaveLength(2)
  })

  it('throws when amount is negative', async () => {
    loanRepo.loans.push(makeLoan('l1', 30))
    await expect(service.execute({ loanId: 'l1', amount: -10 })).rejects.toThrow(NegativeValuesNotAllowedError)
  })

  it('throws when user has insufficient balance', async () => {
    setup(20)
    loanRepo.loans.push(makeLoan('l1', 30))
    await expect(service.execute({ loanId: 'l1', amount: 30 })).rejects.toThrow(InsufficientBalanceError)
  })

  it('throws when amount exceeds remaining debt', async () => {
    loanRepo.loans.push(makeLoan('l1', 50, 30))
    await expect(service.execute({ loanId: 'l1', amount: 25 })).rejects.toThrow(LoanPaymentGreaterThanRemainingError)
  })
})
