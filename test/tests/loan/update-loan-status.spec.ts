import { describe, it, expect, beforeEach, vi } from 'vitest'
import { UpdateLoanStatusService } from '../../../src/services/loan/update-loan-status'
import { CreateTransactionService } from '../../../src/services/transaction/create-transaction'
import {
  FakeLoanRepository,
  FakeUnitRepository,
  FakeTransactionRepository,
  FakeBarberUsersRepository,
  FakeCashRegisterRepository,
} from '../../helpers/fake-repositories'
import {
  makeProfile,
  makeUser,
  defaultUnit,
  makeCashSession,
} from '../../helpers/default-values'
import { LoanStatus, RoleName, TransactionType } from '@prisma/client'

let loanRepo: FakeLoanRepository
let unitRepo: FakeUnitRepository
let txRepo: FakeTransactionRepository
let barberRepo: FakeBarberUsersRepository
let cashRepo: FakeCashRegisterRepository
let service: UpdateLoanStatusService
let user: ReturnType<typeof makeUser>

vi.mock(
  '../../../src/services/@factories/transaction/make-create-transaction',
  () => ({
    makeCreateTransaction: () =>
      new CreateTransactionService(txRepo, barberRepo, cashRepo),
  }),
)

function setup(unitId = 'unit-1') {
  txRepo = new FakeTransactionRepository()
  loanRepo = new FakeLoanRepository()
  unitRepo = new FakeUnitRepository({
    ...defaultUnit,
    id: unitId,
    totalBalance: 100,
  })
  barberRepo = new FakeBarberUsersRepository()
  cashRepo = new FakeCashRegisterRepository()
  const profile = makeProfile('p1', 'u1')
  const unit = unitRepo.unit
  user = makeUser('u1', profile, unit)
  barberRepo.users.push(user)
  cashRepo.session = { ...makeCashSession('s1', unit.id), user }
  service = new UpdateLoanStatusService(loanRepo, unitRepo)
}

function makeLoan(id: string, amount: number) {
  return {
    id,
    userId: user.id,
    unitId: user.unitId,
    sessionId: 's1',
    amount,
    status: LoanStatus.PENDING,
    createdAt: new Date('2024-01-01'),
    paidAt: null,
    updatedById: null,
    transactions: [],
  }
}

describe('Update loan status service', () => {
  beforeEach(() => {
    setup()
  })

  it('throws when loan not found', async () => {
    await expect(
      service.execute({
        loanId: 'nope',
        status: LoanStatus.VALUE_TRANSFERRED,
        updatedById: user.id,
        user: {
          sub: user.id,
          role: RoleName.ADMIN,
          unitId: user.unitId,
          organizationId: user.organizationId,
        },
      }),
    ).rejects.toThrow('Loan not found')
  })

  it('prevents manager from updating loan of another unit', async () => {
    loanRepo.loans.push(makeLoan('l1', 30))
    await expect(
      service.execute({
        loanId: 'l1',
        status: LoanStatus.VALUE_TRANSFERRED,
        updatedById: user.id,
        user: {
          sub: 'm1',
          role: RoleName.MANAGER,
          unitId: 'other',
          organizationId: user.organizationId,
        },
      }),
    ).rejects.toThrow('Unauthorized')
  })

  it('creates transaction when marking loan as paid', async () => {
    loanRepo.loans.push(makeLoan('l1', 30))
    await service.execute({
      loanId: 'l1',
      status: LoanStatus.VALUE_TRANSFERRED,
      updatedById: user.id,
      user: {
        sub: user.id,
        role: RoleName.ADMIN,
        unitId: user.unitId,
        organizationId: user.organizationId,
      },
    })
    expect(txRepo.transactions).toHaveLength(1)
    expect(txRepo.transactions[0].type).toBe(TransactionType.WITHDRAWAL)
    expect(txRepo.transactions[0].amount).toBe(30)
    expect(unitRepo.unit.totalBalance).toBe(70)
  })
})
