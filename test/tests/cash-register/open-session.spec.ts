import { describe, it, expect, beforeEach } from 'vitest'
import { OpenCashSessionUseCase } from '../../../src/modules/finance/application/use-cases/open-cash-session'
import {
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
import { InMemoryCashRegisterRepositoryAdapter } from '../../../src/modules/finance/infra/repositories/in-memory/in-memory-cash-register-repository'
import { Money } from '../../../src/core/domain/value-objects/money'
import { TransactionRunner } from '../../../src/core/application/ports/transaction-runner'

describe('Open session service', () => {
  let cashRegisterRepo: InMemoryCashRegisterRepositoryAdapter
  let transactionRepo: FakeTransactionRepository
  let profilesRepo: FakeProfilesRepository
  let useCase: OpenCashSessionUseCase
  let incrementBalanceUnit: IncrementBalanceUnitService
  let barberUsersRepo: InMemoryBarberUsersRepository

  beforeEach(() => {
    cashRegisterRepo = new InMemoryCashRegisterRepositoryAdapter()
    transactionRepo = new FakeTransactionRepository()
    profilesRepo = new FakeProfilesRepository()
    barberUsersRepo = new InMemoryBarberUsersRepository([
      { ...defaultUser, id: sessionUser.sub, profile: null, unit: null },
    ])
    incrementBalanceUnit = new IncrementBalanceUnitService(
      new FakeUnitRepository({ ...defaultUnit }, [{ ...defaultUnit }]),
      new CreateTransactionService(
        transactionRepo,
        barberUsersRepo,
        cashRegisterRepo.legacy,
      ),
    )
    const runner: TransactionRunner = {
      run: async (fn) => fn(undefined as never),
    }
    useCase = new OpenCashSessionUseCase(
      cashRegisterRepo,
      profilesRepo,
      incrementBalanceUnit,
      runner,
    )
  })

  it('opens session without initial amount', async () => {
    const res = await useCase.execute({
      actorId: sessionUser.sub,
      unitId: sessionUser.unitId,
      initialAmount: Money.zero(),
    })
    expect(res.session.unitId).toBe('unit-1')
    expect(transactionRepo.transactions).toHaveLength(0)
  })

  it('creates addition transaction when initial amount > 0', async () => {
    await useCase.execute({
      actorId: sessionUser.sub,
      unitId: sessionUser.unitId,
      initialAmount: Money.from(50),
    })
    expect(transactionRepo.transactions).toHaveLength(1)
    expect(transactionRepo.transactions[0].amount).toBe(50)
  })

  it('throws when session already open', async () => {
    await useCase.execute({
      actorId: sessionUser.sub,
      unitId: sessionUser.unitId,
      initialAmount: Money.zero(),
    })
    await expect(
      useCase.execute({
        actorId: sessionUser.sub,
        unitId: sessionUser.unitId,
        initialAmount: Money.zero(),
      }),
    ).rejects.toThrow('Cash register already open for this unit')
  })

  it('throws when user not found', async () => {
    await expect(
      useCase.execute({
        actorId: '',
        unitId: sessionUser.unitId,
        initialAmount: Money.zero(),
      }),
    ).rejects.toThrow('User not found')
  })
})
