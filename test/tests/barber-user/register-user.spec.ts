import { describe, it, expect, beforeEach } from 'vitest'
import { RegisterUserService } from '../../../src/services/barber-user/register-user'
import {
  InMemoryBarberUsersRepository,
  FakeUnitRepository,
  InMemoryPermissionRepository,
} from '../../helpers/fake-repositories'
import { defaultUnit, baseRegisterUserData } from '../../helpers/default-values'

describe('Register user service', () => {
  let repo: InMemoryBarberUsersRepository
  let unitRepo: FakeUnitRepository
  let service: RegisterUserService
  let permRepo: InMemoryPermissionRepository

  beforeEach(() => {
    repo = new InMemoryBarberUsersRepository()
    unitRepo = new FakeUnitRepository({ ...defaultUnit }, [{ ...defaultUnit }])
    permRepo = new InMemoryPermissionRepository()
    service = new RegisterUserService(repo, unitRepo, permRepo)
  })

  it('creates user and profile', async () => {
    const res = await service.execute({
      ...baseRegisterUserData,
      unitId: defaultUnit.id,
    })
    expect(repo.users).toHaveLength(1)
    expect(res.profile.userId).toBe(res.user.id)
  })

  it('validates permissions against role', async () => {
    permRepo.permissions.push({ id: 'p1', name: 'n', unitId: defaultUnit.id } as any)
    ;(permRepo.permissions[0] as any).roles = [{ id: 'role-1' }]
    await expect(
      service.execute({
        ...baseRegisterUserData,
        unitId: defaultUnit.id,
        permissions: ['p2'],
      }),
    ).rejects.toThrow('permission not allowed for role')
  })

  it('throws when email already exists', async () => {
    await service.execute({ ...baseRegisterUserData, unitId: defaultUnit.id })
    await expect(
      service.execute({ ...baseRegisterUserData, unitId: defaultUnit.id }),
    ).rejects.toThrow('E-mail already exists')
  })

  it('throws when unit not exists', async () => {
    const badUnit = new FakeUnitRepository({ ...defaultUnit, id: 'x' }, [])
    service = new RegisterUserService(repo, badUnit, permRepo)
    await expect(
      service.execute({ ...baseRegisterUserData, unitId: 'x' }),
    ).rejects.toThrow('Unit not exists')
  })
})
