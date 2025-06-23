import { describe, it, expect, beforeEach } from 'vitest'
import { AddProfileWorkHourService } from '../../../src/services/profile/add-profile-work-hour'
import { FakeProfileWorkHourRepository } from '../../helpers/fake-repositories'


describe('Add profile work hour service', () => {
  let repo: FakeProfileWorkHourRepository
  let service: AddProfileWorkHourService

  beforeEach(() => {
    repo = new FakeProfileWorkHourRepository()
    service = new AddProfileWorkHourService(repo)
  })

  it('adds work hour for profile', async () => {
    const res = await service.execute({ profileId: 'p1', dayHourId: 'dh-1' })

    expect(repo.items).toHaveLength(1)
    expect(res.workHour.profileId).toBe('p1')
  })

  it('finds work hours by profile', async () => {
    await service.execute({ profileId: 'p2', dayHourId: 'dh-2' })
    await service.execute({ profileId: 'p2', dayHourId: 'dh-3' })

    const items = await repo.findManyByProfile('p2')
    expect(items).toHaveLength(2)
  })

  it('throws when adding duplicate work hour', async () => {
    await service.execute({ profileId: 'p3', dayHourId: 'dh-4' })

    await expect(
      service.execute({ profileId: 'p3', dayHourId: 'dh-4' }),
    ).rejects.toThrow()
  })
})
