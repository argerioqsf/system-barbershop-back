import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PayUserService } from '../../../src/services/loan/pay-user'
import { FakeLoanRequestRepository, FakeTransactionRepository, FakeBarberUsersRepository, FakeCashRegisterRepository, FakeProfilesRepository, FakeUnitRepository, FakeOrganizationRepository } from '../../helpers/fake-repositories'
import { WithdrawalBalanceTransactionService } from '../../../src/services/transaction/withdrawal-balance-transaction'
import { CreateTransactionService } from '../../../src/services/transaction/create-transaction'
import { defaultUser, defaultProfile, defaultUnit, defaultOrganization } from '../../helpers/default-values'

vi.mock('../../../src/services/@factories/transaction/make-create-transaction', () => ({
  makeCreateTransaction: () => new CreateTransactionService(transactionRepo, barberRepo, cashRepo),
}))

let transactionRepo: FakeTransactionRepository
let barberRepo: FakeBarberUsersRepository
let cashRepo: FakeCashRegisterRepository

function setup() {
  transactionRepo = new FakeTransactionRepository()
  barberRepo = new FakeBarberUsersRepository()
  cashRepo = new FakeCashRegisterRepository()
  const profileRepo = new FakeProfilesRepository()
  const unitRepo = new FakeUnitRepository(defaultUnit)
  const orgRepo = new FakeOrganizationRepository(defaultOrganization)

  const profile = { ...defaultProfile, totalBalance: 100, user: { ...defaultUser } }
  profileRepo.profiles.push(profile)
  const user = { ...defaultUser, profile, unit: defaultUnit }
  barberRepo.users.push(user)

  cashRepo.session = {
    id: 's1',
    openedById: user.id,
    unitId: user.unitId,
    openedAt: new Date(),
    closedAt: null,
    initialAmount: 0,
    transactions: [],
    sales: [],
    finalAmount: null,
    user: defaultUser,
  }

  const withdrawal = new WithdrawalBalanceTransactionService(
    transactionRepo,
    barberRepo,
    cashRepo,
    profileRepo,
    unitRepo,
    orgRepo,
  )

  const loanRepo = new FakeLoanRequestRepository([
    { id: 'l1', userId: user.id, unitId: user.unitId, amount: 20, status: 'ACCEPTED', createdAt: new Date(), updatedAt: new Date() },
  ])

  const service = new PayUserService(withdrawal, loanRepo)
  return { service, loanRepo }
}

describe('Pay user service', () => {
  it('marks loans as deducted', async () => {
    const { service, loanRepo } = setup()
    await service.execute({ actorId: defaultUser.id, userId: defaultUser.id, amount: 50, description: '' })
    expect(loanRepo.items[0].status).toBe('DEDUCTED')
    expect(transactionRepo.transactions).toHaveLength(1)
  })
})
