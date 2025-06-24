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
      startHour: '08:00',
      endHour: '12:00',
    })

    expect(repo.items).toHaveLength(1)
    expect(res.dayHour.weekDay).toBe(1)
  })
})
