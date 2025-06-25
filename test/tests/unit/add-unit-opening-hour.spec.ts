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
    await service.execute({ unitId: 'unit-2', weekDay: 1, startHour: '08:00', endHour: '10:00' })
    await service.execute({ unitId: 'unit-2', weekDay: 2, startHour: '09:00', endHour: '12:00' })

    const items = await repo.findManyByUnit('unit-2')
    expect(items).toHaveLength(2)
  })

  it('throws when interval overlaps existing hour', async () => {
    await service.execute({
      unitId: 'unit-3',
      weekDay: 1,
      startHour: '08:00',
      endHour: '12:00',
    })

    await expect(
      service.execute({
        unitId: 'unit-3',
        weekDay: 1,
        startHour: '11:00',
        endHour: '13:00',
      }),
    ).rejects.toThrow()
  })

  it('allows multiple intervals on same day if no overlap', async () => {
    await service.execute({
      unitId: 'unit-4',
      weekDay: 1,
      startHour: '08:00',
      endHour: '12:00',
    })
    const res = await service.execute({
      unitId: 'unit-4',
      weekDay: 1,
      startHour: '13:00',
      endHour: '18:00',
    })

    const items = await repo.findManyByUnit('unit-4', 1)
    expect(items).toHaveLength(2)
    expect(res.openingHour.startHour).toBe('13:00')
  })
})
