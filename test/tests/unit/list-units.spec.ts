import { describe, it, expect, beforeEach } from 'vitest'
import { ListUnitsService } from '../../../src/services/unit/list-units'
import { FakeUnitRepository } from '../../helpers/fake-repositories'
import { makeUnit } from '../../helpers/default-values'

const unit1 = makeUnit('unit-1', 'A', 'a', 'org-1')
const unit2 = makeUnit('unit-2', 'B', 'b', 'org-2')

describe('List units service', () => {
  let repo: FakeUnitRepository
  let service: ListUnitsService

  beforeEach(() => {
    repo = new FakeUnitRepository(unit1, [unit1, unit2])
    service = new ListUnitsService(repo)
  })

  it('lists all units for admin', async () => {
    const result = await service.execute({
      sub: '1',
      role: 'ADMIN',
      organizationId: 'org-1',
      unitId: 'unit-1',
    } as any)
    expect(result.units).toHaveLength(2)
  })

  it('lists units from organization for non admin', async () => {
    const result = await service.execute({
      sub: '1',
      role: 'BARBER',
      organizationId: 'org-1',
      unitId: 'unit-1',
    } as any)
    expect(result.units).toHaveLength(2)
    expect(result.units[0].id).toBe('unit-1')
  })

  it('lists only own unit for manager', async () => {
    const result = await service.execute({
      sub: '1',
      role: 'MANAGER',
      organizationId: 'org-1',
      unitId: 'unit-1',
    } as any)
    expect(result.units).toHaveLength(2)
    expect(result.units[0].id).toBe('unit-1')
  })

  it('throws if user not found', async () => {
    await expect(
      service.execute({
        sub: '',
        role: 'ADMIN',
        organizationId: 'org-1',
        unitId: 'unit-1',
      } as any),
    ).rejects.toThrow('User not found')
  })
})
