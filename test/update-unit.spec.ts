import { describe, it, expect, beforeEach } from 'vitest'
import { UpdateUnitService } from '../src/services/unit/update-unit'
import { FakeUnitRepository } from './helpers/fake-repositories'

const unit = { id: 'unit-1', name: 'A', slug: 'a', organizationId: 'org-1', totalBalance: 0, allowsLoan: false }

describe('Update unit service', () => {
  let repo: FakeUnitRepository
  let service: UpdateUnitService

  beforeEach(() => {
    repo = new FakeUnitRepository(unit, [unit])
    service = new UpdateUnitService(repo)
  })

  it('updates unit data', async () => {
    const result = await service.execute({ id: 'unit-1', name: 'New', allowsLoan: true })
    expect(result.unit.name).toBe('New')
    expect(result.unit.allowsLoan).toBe(true)
    expect(repo.units[0].name).toBe('New')
  })
})
