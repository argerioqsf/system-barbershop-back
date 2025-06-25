import { describe, it, expect, beforeEach } from 'vitest'
import { AddUnitOpeningHourService } from '../../../src/services/unit/add-unit-opening-hour'
import { FakeUnitOpeningHourRepository } from '../../helpers/fake-repositories'

describe('Add unit opening hour service', () => {
  let repo: FakeUnitOpeningHourRepository
  let service: AddUnitOpeningHourService

  beforeEach(() => {
    repo = new FakeUnitOpeningHourRepository()
    service = new AddUnitOpeningHourService(repo)
  })

  it('creates opening hour for unit', async () => {
    const res = await service.execute({
      unitId: 'unit-1',
      weekDay: 1,
      startHour: '08:00',
      endHour: '12:00',
    })

    expect(repo.items).toHaveLength(1)
    expect(res.openingHour.unitId).toBe('unit-1')
  })

  it('lists relations by unit', async () => {
    await service.execute({
      unitId: 'unit-2',
      weekDay: 1,
      startHour: '08:00',
      endHour: '10:00',
    })
    await service.execute({
      unitId: 'unit-2',
      weekDay: 2,
      startHour: '09:00',
      endHour: '12:00',
    })

    const items = await repo.findManyByUnit('unit-2')
    expect(items).toHaveLength(2)
  })
})
