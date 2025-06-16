import { describe, it, expect, beforeEach } from 'vitest'
import { ListUnitsService } from '../src/services/unit/list-units'
import { FakeUnitRepository } from './helpers/fake-repositories'

const unit1 = { id: 'unit-1', name: 'A', slug: 'a', organizationId: 'org-1', totalBalance: 0, allowsLoan: false }
const unit2 = { id: 'unit-2', name: 'B', slug: 'b', organizationId: 'org-2', totalBalance: 0, allowsLoan: false }

describe('List units service', () => {
  let repo: FakeUnitRepository
  let service: ListUnitsService

  beforeEach(() => {
    repo = new FakeUnitRepository(unit1, [unit1, unit2])
    service = new ListUnitsService(repo)
  })

  it('lists all units for admin', async () => {
    const result = await service.execute({ sub: '1', role: 'ADMIN', organizationId: 'org-1', unitId: 'unit-1' } as any)
    expect(result.units).toHaveLength(2)
  })

  it('lists units from organization for non admin', async () => {
    const result = await service.execute({ sub: '1', role: 'BARBER', organizationId: 'org-1', unitId: 'unit-1' } as any)
    expect(result.units).toHaveLength(1)
    expect(result.units[0].id).toBe('unit-1')
  })

  it('throws if user not found', async () => {
    await expect(
      service.execute({ sub: '', role: 'ADMIN', organizationId: 'org-1', unitId: 'unit-1' } as any),
    ).rejects.toThrow('User not found')
  })
})
