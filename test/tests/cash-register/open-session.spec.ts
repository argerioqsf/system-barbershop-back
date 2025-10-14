import { describe, it, expect, beforeEach } from 'vitest'
import { OpenSessionService } from '../../../src/services/cash-register/open-session'
import {
  InMemoryCashRegisterRepository,
  FakeTransactionRepository,
  FakeProfilesRepository,
  FakeUnitRepository,
  InMemoryBarberUsersRepository,
} from '../../helpers/fake-repositories'
import {
  defaultUnit,
  defaultUser,
  sessionUser,
} from '../../helpers/default-values'
import { IncrementBalanceUnitService } from '../../../src/services/unit/increment-balance'
import { CreateTransactionService } from '../../../src/services/transaction/create-transaction'
describe('Open session service', () => {
  let repo: InMemoryCashRegisterRepository
  let transactionRepo: FakeTransactionRepository
  let profilesRepo: FakeProfilesRepository
  let service: OpenSessionService
  let incrementBalanceUnit: IncrementBalanceUnitService
  let barberUsersRepo: InMemoryBarberUsersRepository

  beforeEach(() => {
    repo = new InMemoryCashRegisterRepository()
    transactionRepo = new FakeTransactionRepository()
    profilesRepo = new FakeProfilesRepository()
    barberUsersRepo = new InMemoryBarberUsersRepository([
      { ...defaultUser, id: sessionUser.sub, profile: null, unit: null },
    ])
    incrementBalanceUnit = new IncrementBalanceUnitService(
      new FakeUnitRepository({ ...defaultUnit }, [{ ...defaultUnit }]),
      new CreateTransactionService(transactionRepo, barberUsersRepo, repo),
    )
    service = new OpenSessionService(repo, profilesRepo, incrementBalanceUnit)
  })

  it('opens session without initial amount', async () => {
    const res = await service.execute({ user: sessionUser, initialAmount: 0 })
    expect(res.session.unitId).toBe('unit-1')
    expect(repo.sessions).toHaveLength(1)
    expect(transactionRepo.transactions).toHaveLength(0)
  })

  it('creates addition transaction when initial amount > 0', async () => {
    await service.execute({ user: sessionUser, initialAmount: 50 })
    expect(transactionRepo.transactions).toHaveLength(1)
    expect(transactionRepo.transactions[0].amount).toBe(50)
  })

  it('throws when session already open', async () => {
    await service.execute({ user: sessionUser, initialAmount: 0 })
    await expect(
      service.execute({ user: sessionUser, initialAmount: 0 }),
    ).rejects.toThrow('Cash register already open for this unit')
  })

  it('throws when user not found', async () => {
    await expect(
      service.execute({ user: undefined, initialAmount: 0 }),
    ).rejects.toThrow('User not found')
  })
})
