import { describe, it, expect, beforeEach } from 'vitest'
import { CreateDayHourService } from '../../../src/services/day-hour/create-day-hour'
import { FakeDayHourRepository } from '../../helpers/fake-repositories'

describe('Create day hour service', () => {
  let repo: FakeDayHourRepository
  let service: CreateDayHourService

  beforeEach(() => {
    repo = new FakeDayHourRepository()
    service = new CreateDayHourService(repo)
  })

  it('creates a day hour', async () => {
    const res = await service.execute({
      weekDay: 1,
      startHour: new Date('1970-01-01T08:00:00Z'),
      endHour: new Date('1970-01-01T12:00:00Z'),
    })

    expect(repo.items).toHaveLength(1)
    expect(res.dayHour.weekDay).toBe(1)
  })
})
