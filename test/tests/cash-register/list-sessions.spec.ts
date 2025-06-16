import { describe, it, expect, beforeEach } from 'vitest'
import { ListSessionsService } from '../../../src/services/cash-register/list-sessions'
import { InMemoryCashRegisterRepository } from '../../helpers/fake-repositories'

const s1 = {
  id: 's1',
  openedById: 'u1',
  unitId: 'unit-1',
  openedAt: new Date(),
  closedAt: null,
  initialAmount: 0,
  finalAmount: null,
  user: {},
  sales: [],
  transactions: [],
  unit: { organizationId: 'org-1' },
} as any

const s2 = {
  id: 's2',
  openedById: 'u2',
  unitId: 'unit-2',
  openedAt: new Date(),
  closedAt: null,
  initialAmount: 0,
  finalAmount: null,
  user: {},
  sales: [],
  transactions: [],
  unit: { organizationId: 'org-2' },
} as any

describe('List sessions service', () => {
  let repo: InMemoryCashRegisterRepository
  let service: ListSessionsService

  beforeEach(() => {
    repo = new InMemoryCashRegisterRepository()
    repo.sessions.push(s1, s2)
    service = new ListSessionsService(repo)
  })

  it('lists all for admin', async () => {
    const res = await service.execute({
      sub: '1',
      role: 'ADMIN',
      unitId: 'unit-1',
      organizationId: 'org-1',
    } as any)
    expect(res.sessions).toHaveLength(2)
  })

  it('filters by organization for owner', async () => {
    const res = await service.execute({
      sub: '1',
      role: 'OWNER',
      unitId: 'unit-1',
      organizationId: 'org-1',
    } as any)
    expect(res.sessions).toHaveLength(1)
    expect(res.sessions[0].id).toBe('s1')
  })

  it('filters by unit for others', async () => {
    const res = await service.execute({
      sub: '1',
      role: 'BARBER',
      unitId: 'unit-2',
      organizationId: 'org-2',
    } as any)
    expect(res.sessions).toHaveLength(1)
    expect(res.sessions[0].id).toBe('s2')
  })

  it('throws if user not found', async () => {
    await expect(
      service.execute({ sub: '', role: 'ADMIN', unitId: 'u1', organizationId: 'o1' } as any),
    ).rejects.toThrow('User not found')
  })
})
