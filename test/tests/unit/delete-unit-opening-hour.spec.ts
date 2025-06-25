import { describe, it, expect, beforeEach } from 'vitest'
import { DeleteUnitOpeningHourService } from '../../../src/services/unit/delete-unit-opening-hour'
import { FakeUnitOpeningHourRepository } from '../../helpers/fake-repositories'

const item = { id: 'uh-1', unitId: 'u1', weekDay: 1, startHour: '08:00', endHour: '12:00' }

describe('Delete unit opening hour service', () => {
  let repo: FakeUnitOpeningHourRepository
  let service: DeleteUnitOpeningHourService

  beforeEach(() => {
    repo = new FakeUnitOpeningHourRepository([item as any])
    service = new DeleteUnitOpeningHourService(repo)
  })

  it('removes opening hour', async () => {
    await service.execute({ id: 'uh-1' })
    expect(repo.items).toHaveLength(0)
  })
})
