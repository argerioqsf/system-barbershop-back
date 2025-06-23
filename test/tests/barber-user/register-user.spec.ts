import { describe, it, expect, beforeEach } from 'vitest'
import { RegisterUserService } from '../../../src/services/barber-user/register-user'
import {
  InMemoryBarberUsersRepository,
  FakeUnitRepository,
  InMemoryPermissionRepository,
  InMemoryRoleRepository,
} from '../../helpers/fake-repositories'
import { defaultUnit, baseRegisterUserData } from '../../helpers/default-values'
import { PermissionName } from '@prisma/client'

describe('Register user service', () => {
  let repo: InMemoryBarberUsersRepository
  let unitRepo: FakeUnitRepository
  let service: RegisterUserService
  let permRepo: InMemoryPermissionRepository
  let roleRepo: InMemoryRoleRepository

  beforeEach(() => {
    repo = new InMemoryBarberUsersRepository()
    unitRepo = new FakeUnitRepository({ ...defaultUnit }, [{ ...defaultUnit }])
    permRepo = new InMemoryPermissionRepository()
    roleRepo = new InMemoryRoleRepository([
      { id: 'role-1', name: 'ADMIN', unitId: defaultUnit.id } as any,
    ])
    service = new RegisterUserService(repo, unitRepo, permRepo, roleRepo)
  })

  it('creates user and profile', async () => {
    const res = await service.execute(
      {
        sub: 'admin',
        role: 'ADMIN',
        organizationId: defaultUnit.organizationId,
        unitId: defaultUnit.id,
      } as any,
      {
        ...baseRegisterUserData,
        unitId: defaultUnit.id,
      },
    )
    expect(repo.users).toHaveLength(1)
    expect(res.profile.userId).toBe(res.user.id)
  })

  it('validates permissions against role', async () => {
    permRepo.permissions.push({
      id: 'p1',
      name: 'n',
      unitId: defaultUnit.id,
    } as any)
    ;(permRepo.permissions[0] as any).roles = [{ id: 'role-1' }]
    await expect(
      service.execute(
        {
          sub: 'admin',
          role: 'ADMIN',
          organizationId: defaultUnit.organizationId,
          unitId: defaultUnit.id,
        } as any,
        {
          ...baseRegisterUserData,
          unitId: defaultUnit.id,
          permissions: ['p2'],
        },
      ),
    ).rejects.toThrow('permission not allowed for role')
  })

  it('throws when email already exists', async () => {
    await service.execute(
      {
        sub: 'admin',
        role: 'ADMIN',
        organizationId: defaultUnit.organizationId,
        unitId: defaultUnit.id,
      } as any,
      { ...baseRegisterUserData, unitId: defaultUnit.id },
    )
    await expect(
      service.execute(
        {
          sub: 'admin',
          role: 'ADMIN',
          organizationId: defaultUnit.organizationId,
          unitId: defaultUnit.id,
        } as any,
        { ...baseRegisterUserData, unitId: defaultUnit.id },
      ),
    ).rejects.toThrow('E-mail already exists')
  })

  it('throws when unit not exists', async () => {
    const badUnit = new FakeUnitRepository({ ...defaultUnit, id: 'x' }, [])
    const badRoleRepo = new InMemoryRoleRepository([
      { id: 'role-1', name: 'ADMIN', unitId: 'x' } as any,
    ])
    service = new RegisterUserService(repo, badUnit, permRepo, badRoleRepo)
    await expect(
      service.execute(
        {
          sub: 'admin',
          role: 'ADMIN',
          organizationId: defaultUnit.organizationId,
          unitId: 'x',
        } as any,
        { ...baseRegisterUserData, unitId: 'x' },
      ),
    ).rejects.toThrow('Unit not exists')
  })

  it('requires permission to create client', async () => {
    const clientRole = { id: 'client', name: 'CLIENT', unitId: defaultUnit.id } as any
    roleRepo = new InMemoryRoleRepository([
      { id: 'role-1', name: 'ADMIN', unitId: defaultUnit.id } as any,
      clientRole,
    ])
    service = new RegisterUserService(repo, unitRepo, permRepo, roleRepo)
    await expect(
      service.execute(
        { sub: 'admin', role: 'ADMIN', organizationId: defaultUnit.organizationId, unitId: defaultUnit.id, permissions: [] } as any,
        { ...baseRegisterUserData, unitId: defaultUnit.id, roleId: clientRole.id },
      ),
    ).rejects.toThrow('Permission denied')
  })

  it('requires permission to create barber', async () => {
    const barberRole = { id: 'barber', name: 'BARBER', unitId: defaultUnit.id } as any
    roleRepo = new InMemoryRoleRepository([
      { id: 'role-1', name: 'MANAGER', unitId: defaultUnit.id } as any,
      barberRole,
    ])
    service = new RegisterUserService(repo, unitRepo, permRepo, roleRepo)
    await expect(
      service.execute(
        { sub: 'manager', role: 'MANAGER', organizationId: defaultUnit.organizationId, unitId: defaultUnit.id, permissions: [] } as any,
        { ...baseRegisterUserData, unitId: defaultUnit.id, roleId: barberRole.id },
      ),
    ).rejects.toThrow('Permission denied')
  })

  it('requires permission to create attendant', async () => {
    const attendantRole = { id: 'att', name: 'ATTENDANT', unitId: defaultUnit.id } as any
    roleRepo = new InMemoryRoleRepository([
      { id: 'role-1', name: 'MANAGER', unitId: defaultUnit.id } as any,
      attendantRole,
    ])
    service = new RegisterUserService(repo, unitRepo, permRepo, roleRepo)
    await expect(
      service.execute(
        { sub: 'manager', role: 'MANAGER', organizationId: defaultUnit.organizationId, unitId: defaultUnit.id, permissions: [] } as any,
        { ...baseRegisterUserData, unitId: defaultUnit.id, roleId: attendantRole.id },
      ),
    ).rejects.toThrow('Permission denied')
  })

  it('requires permission to create owner', async () => {
    const ownerRole = { id: 'owner', name: 'OWNER', unitId: defaultUnit.id } as any
    roleRepo = new InMemoryRoleRepository([
      { id: 'role-1', name: 'MANAGER', unitId: defaultUnit.id } as any,
      ownerRole,
    ])
    service = new RegisterUserService(repo, unitRepo, permRepo, roleRepo)
    await expect(
      service.execute(
        { sub: 'manager', role: 'MANAGER', organizationId: defaultUnit.organizationId, unitId: defaultUnit.id, permissions: [] } as any,
        { ...baseRegisterUserData, unitId: defaultUnit.id, roleId: ownerRole.id },
      ),
    ).rejects.toThrow('Permission denied')
  })

  it('allows admin with permission to create client', async () => {
    const clientRole = { id: 'client', name: 'CLIENT', unitId: defaultUnit.id } as any
    roleRepo = new InMemoryRoleRepository([
      { id: 'role-1', name: 'ADMIN', unitId: defaultUnit.id } as any,
      clientRole,
    ])
    permRepo = new InMemoryPermissionRepository([
      {
        id: 'perm-client',
        name: PermissionName.CREATE_USER_CLIENT,
        unitId: defaultUnit.id,
      } as any,
    ])
    ;(permRepo.permissions[0] as any).roles = [clientRole]
    service = new RegisterUserService(repo, unitRepo, permRepo, roleRepo)
    const res = await service.execute(
      {
        sub: 'admin',
        role: 'ADMIN',
        organizationId: defaultUnit.organizationId,
        unitId: defaultUnit.id,
        permissions: [PermissionName.CREATE_USER_CLIENT],
      } as any,
      { ...baseRegisterUserData, unitId: defaultUnit.id, roleId: clientRole.id },
    )
    expect(res.profile.roleId).toBe(clientRole.id)
  })
})
