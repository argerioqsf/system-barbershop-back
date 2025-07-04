import { describe, it, expect, beforeEach } from 'vitest'
import { CreateLoanService } from '../../../src/services/loan/create-loan'
import { FakeLoanRepository, FakeBarberUsersRepository, FakeCashRegisterRepository } from '../../helpers/fake-repositories'
import { makeProfile, makeUser, defaultUnit } from '../../helpers/default-values'

let loanRepo: FakeLoanRepository
let userRepo: FakeBarberUsersRepository
let cashRepo: FakeCashRegisterRepository
let service: CreateLoanService
let user: ReturnType<typeof makeUser>

function setup(limit = 100) {
  loanRepo = new FakeLoanRepository()
  userRepo = new FakeBarberUsersRepository()
  cashRepo = new FakeCashRegisterRepository()
  const profile = makeProfile('p1', 'u1')
  const unit = { ...defaultUnit, loanMonthlyLimit: limit }
  user = makeUser('u1', profile, unit)
  userRepo.users.push(user)
  cashRepo.session = {
    id: 's1',
    openedById: user.id,
    unitId: unit.id,
    openedAt: new Date(),
    closedAt: null,
    initialAmount: 0,
    finalAmount: null,
    user,
    sales: [],
    transactions: [],
    loans: [],
  }
  service = new CreateLoanService(loanRepo, userRepo, cashRepo)
}

describe('Create loan service', () => {
  beforeEach(() => {
    setup()
  })

  it('creates loan when under limit', async () => {
    const res = await service.execute({ userId: user.id, amount: 50 })
    expect(res.loan.amount).toBe(50)
    expect(loanRepo.loans).toHaveLength(1)
  })

  it('rejects when limit exceeded', async () => {
    await service.execute({ userId: user.id, amount: 80 })
    await expect(service.execute({ userId: user.id, amount: 30 })).rejects.toThrow('Loan monthly limit exceeded')
  })
})
