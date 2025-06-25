import { describe, it, expect, beforeEach } from 'vitest'
import { ListUnitOpeningHoursService } from '../../../src/services/unit/list-unit-opening-hours'
import { FakeUnitOpeningHourRepository } from '../../helpers/fake-repositories'

const item1 = { id: 'uh-1', unitId: 'u1', weekDay: 1, startHour: '08:00', endHour: '12:00' }
const item2 = { id: 'uh-2', unitId: 'u1', weekDay: 2, startHour: '09:00', endHour: '13:00' }

describe('List unit opening hours service', () => {
  let repo: FakeUnitOpeningHourRepository
  let service: ListUnitOpeningHoursService

  beforeEach(() => {
    repo = new FakeUnitOpeningHourRepository([item1 as any, item2 as any])
    service = new ListUnitOpeningHoursService(repo)
  })

  it('lists opening hours by unit', async () => {
    const { openingHours } = await service.execute({ unitId: 'u1' })
    expect(openingHours).toHaveLength(2)
  })
})
