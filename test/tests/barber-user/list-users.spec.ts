import { describe, it, expect, beforeEach } from 'vitest'
import { ListUsersService } from '../../../src/services/barber-user/list-users'
import { InMemoryBarberUsersRepository } from '../../helpers/fake-repositories'

const u1 = { id: 'u1', email: 'a@a.com', profile: null, unit: { id: 'unit-1' }, organizationId: 'org-1' } as any
const u2 = { id: 'u2', email: 'b@b.com', profile: null, unit: { id: 'unit-2' }, organizationId: 'org-2' } as any

describe('List users service', () => {
  let repo: InMemoryBarberUsersRepository
  let service: ListUsersService

  beforeEach(() => {
    repo = new InMemoryBarberUsersRepository([u1, u2])
    service = new ListUsersService(repo)
  })

  it('lists all for admin', async () => {
    const res = await service.execute({ sub: '1', role: 'ADMIN', unitId: 'unit-1', organizationId: 'org-1' } as any)
    expect(res.users).toHaveLength(2)
  })

  it('filters by organization for owner', async () => {
    const res = await service.execute({ sub: '1', role: 'OWNER', unitId: 'unit-1', organizationId: 'org-1' } as any)
    expect(res.users).toHaveLength(1)
    expect(res.users[0].id).toBe('u1')
  })

  it('filters by unit for others', async () => {
    const res = await service.execute({ sub: '1', role: 'BARBER', unitId: 'unit-2', organizationId: 'org-2' } as any)
    expect(res.users).toHaveLength(1)
    expect(res.users[0].id).toBe('u2')
  })

  it('throws if user not found', async () => {
    await expect(service.execute({ sub: '', role: 'ADMIN', unitId: 'u1', organizationId: 'o1' } as any)).rejects.toThrow('User not found')
  })
})
