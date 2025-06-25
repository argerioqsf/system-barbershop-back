import { describe, it, expect, beforeEach } from 'vitest'
import { DeleteProfileWorkHourService } from '../../../src/services/profile/delete-profile-work-hour'
import { FakeProfileWorkHourRepository } from '../../helpers/fake-repositories'

const item = { id: 'wh-1', profileId: 'p1', weekDay: 1, startHour: '08:00', endHour: '12:00' }

describe('Delete profile work hour service', () => {
  let repo: FakeProfileWorkHourRepository
  let service: DeleteProfileWorkHourService

  beforeEach(() => {
    repo = new FakeProfileWorkHourRepository([item as any])
    service = new DeleteProfileWorkHourService(repo)
  })

  it('removes work hour', async () => {
    await service.execute({ id: 'wh-1' })
    expect(repo.items).toHaveLength(0)
  })
})
