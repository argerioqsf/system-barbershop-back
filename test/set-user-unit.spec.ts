import { describe, it, expect, beforeEach } from 'vitest'
import { SetUserUnitService, UnitNotFromOrganizationError } from '../src/services/users/set-user-unit'
import { InMemoryUserRepository } from '../src/repositories/in-memory/in-memory-users-repository'
import { FakeUnitRepository } from './helpers/fake-repositories'
import { UserNotFoundError } from '../src/services/@errors/user-not-found-error'
import { UnitNotFoundError } from '../src/services/@errors/unit-not-found-error'

const user = {
  id: 'user-1',
  name: 'John',
  email: 'john@example.com',
  password: '123',
  active: true,
  organizationId: 'org-1',
  unitId: 'unit-1',
  createdAt: new Date(),
  profile: null,
}

describe('Set user unit service', () => {
  let userRepo: InMemoryUserRepository
  let unitRepo: FakeUnitRepository
  let service: SetUserUnitService

  beforeEach(() => {
    userRepo = new InMemoryUserRepository()
    userRepo.items.push(user as any)
    const unit = { id: 'unit-2', name: '', slug: '', organizationId: 'org-1', totalBalance: 0, allowsLoan: false }
    unitRepo = new FakeUnitRepository(unit, [unit])
    service = new SetUserUnitService(userRepo, unitRepo)
  })

  it('throws when user token is missing', async () => {
    await expect(service.execute({ user: undefined as any, unitId: 'unit-2' })).rejects.toBeInstanceOf(UserNotFoundError)
  })

  it('throws when unit not found', async () => {
    await expect(service.execute({ user: { ...user, sub: user.id } as any, unitId: 'no-unit' })).rejects.toBeInstanceOf(UnitNotFoundError)
  })

  it('throws when unit is from another organization', async () => {
    const other = { id: 'unit-3', name: '', slug: '', organizationId: 'org-2', totalBalance: 0, allowsLoan: false }
    unitRepo.units.push(other)
    await expect(
      service.execute({ user: { ...user, sub: user.id } as any, unitId: 'unit-3' }),
    ).rejects.toBeInstanceOf(UnitNotFromOrganizationError)
  })

  it('updates user unit when valid', async () => {
    await service.execute({ user: { ...user, sub: user.id } as any, unitId: 'unit-2' })
    expect(userRepo.items[0].unitId).toBe('unit-2')
  })
})
