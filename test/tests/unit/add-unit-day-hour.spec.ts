import { describe, it, expect, beforeEach } from 'vitest'
import { AddUnitDayHourService } from '../../../src/services/unit/add-unit-day-hour'
import { FakeUnitDayHourRepository } from '../../helpers/fake-repositories'

describe('Add unit day hour service', () => {
  let repo: FakeUnitDayHourRepository
  let service: AddUnitDayHourService

  beforeEach(() => {
    repo = new FakeUnitDayHourRepository()
    service = new AddUnitDayHourService(repo)
  })

  it('creates relation between unit and day hour', async () => {
    const res = await service.execute({ unitId: 'unit-1', dayHourId: 'dh-1' })

    expect(repo.items).toHaveLength(1)
    expect(res.unitDayHour.unitId).toBe('unit-1')
  })

  it('lists relations by unit', async () => {
    await service.execute({ unitId: 'unit-2', dayHourId: 'dh-2' })
    await service.execute({ unitId: 'unit-2', dayHourId: 'dh-3' })

    const items = await repo.findManyByUnit('unit-2')
    expect(items).toHaveLength(2)
  })
})
