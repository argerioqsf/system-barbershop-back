import { describe, it, expect, beforeEach } from 'vitest'
import { RegisterUserService } from '../../../src/services/barber-user/register-user'
import { InMemoryBarberUsersRepository, FakeUnitRepository } from '../../helpers/fake-repositories'
import { defaultUnit, baseRegisterUserData } from '../../helpers/default-values'

describe('Register user service', () => {
  let repo: InMemoryBarberUsersRepository
  let unitRepo: FakeUnitRepository
  let service: RegisterUserService

  beforeEach(() => {
    repo = new InMemoryBarberUsersRepository()
    unitRepo = new FakeUnitRepository({ ...defaultUnit }, [{ ...defaultUnit }])
    service = new RegisterUserService(repo, unitRepo)
  })

  it('creates user and profile', async () => {
    const res = await service.execute({ ...baseRegisterUserData, unitId: defaultUnit.id })
    expect(repo.users).toHaveLength(1)
    expect(res.profile.userId).toBe(res.user.id)
  })

  it('throws when email already exists', async () => {
    await service.execute({ ...baseRegisterUserData, unitId: defaultUnit.id })
    await expect(service.execute({ ...baseRegisterUserData, unitId: defaultUnit.id })).rejects.toThrow('User already exists')
  })

  it('throws when unit not exists', async () => {
    const badUnit = new FakeUnitRepository({ ...defaultUnit, id: 'x' }, [])
    service = new RegisterUserService(repo, badUnit)
    await expect(service.execute({ ...baseRegisterUserData, unitId: 'x' })).rejects.toThrow('Unit not exists')
  })
})
