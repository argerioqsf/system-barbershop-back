import { describe, it, expect, beforeEach } from 'vitest'
import {
  SetUserUnitService,
  UnitNotFromOrganizationError,
} from '../../../src/services/users/set-user-unit'
import { InMemoryUserRepository } from '../../../src/repositories/in-memory/in-memory-users-repository'
import { FakeUnitRepository } from '../../helpers/fake-repositories'
import { UserNotFoundError } from '../../../src/services/@errors/user/user-not-found-error'
import { UnitNotFoundError } from '../../../src/services/@errors/unit/unit-not-found-error'
import { namedUser, makeUnit } from '../../helpers/default-values'

const user = { ...namedUser }

describe('Set user unit service', () => {
  let userRepo: InMemoryUserRepository
  let unitRepo: FakeUnitRepository
  let service: SetUserUnitService

  beforeEach(() => {
    userRepo = new InMemoryUserRepository()
    userRepo.items.push(user)
    const unit = makeUnit('unit-2', '', '', 'org-1')
    unitRepo = new FakeUnitRepository(unit, [unit])
    service = new SetUserUnitService(userRepo, unitRepo)
  })

  it('throws when user token is missing', async () => {
    await expect(
      service.execute({ user: undefined, unitId: 'unit-2' }),
    ).rejects.toBeInstanceOf(UserNotFoundError)
  })

  it('throws when unit not found', async () => {
    await expect(
      service.execute({
        user: { ...user, sub: user.id },
        unitId: 'no-unit',
      }),
    ).rejects.toBeInstanceOf(UnitNotFoundError)
  })

  it('throws when unit is from another organization', async () => {
    const other = makeUnit('unit-3', '', '', 'org-2')
    unitRepo.units.push(other)
    await expect(
      service.execute({
        user: { ...user, sub: user.id },
        unitId: 'unit-3',
      }),
    ).rejects.toBeInstanceOf(UnitNotFromOrganizationError)
  })

  it('updates user unit when valid', async () => {
    await service.execute({
      user: { ...user, sub: user.id },
      unitId: 'unit-2',
    })
    expect(userRepo.items[0].unitId).toBe('unit-2')
  })
})
