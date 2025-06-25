import { describe, it, expect, beforeEach } from 'vitest'
import { DeleteProfileBlockedHourService } from '../../../src/services/profile/delete-profile-blocked-hour'
import { FakeProfileBlockedHourRepository } from '../../helpers/fake-repositories'

const item = { id: 'bh-1', profileId: 'p1', startHour: new Date(), endHour: new Date() }

describe('Delete profile blocked hour service', () => {
  let repo: FakeProfileBlockedHourRepository
  let service: DeleteProfileBlockedHourService

  beforeEach(() => {
    repo = new FakeProfileBlockedHourRepository([item as any])
    service = new DeleteProfileBlockedHourService(repo)
  })

  it('removes blocked hour', async () => {
    await service.execute({ id: 'bh-1' })
    expect(repo.items).toHaveLength(0)
  })
})
