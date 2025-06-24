import { describe, it, expect, beforeEach } from 'vitest'
import { AddProfileWorkHourService } from '../../../src/services/profile/add-profile-work-hour'
import { FakeProfileWorkHourRepository } from '../../helpers/fake-repositories'
import { PermissionName } from '@prisma/client'

describe('Add profile work hour service', () => {
  let repo: FakeProfileWorkHourRepository
  let service: AddProfileWorkHourService

  beforeEach(() => {
    repo = new FakeProfileWorkHourRepository()
    service = new AddProfileWorkHourService(repo)
  })

  it('adds work hour for profile', async () => {
    const token = {
      sub: 'p1',
      unitId: 'unit-1',
      organizationId: 'org-1',
      role: 'BARBER',
      permissions: [PermissionName.MANAGE_SELF_WORK_HOURS],
    }
    const res = await service.execute(token, {
      profileId: 'p1',
      weekDay: 1,
      startHour: '08:00',
      endHour: '12:00',
    })

    expect(repo.items).toHaveLength(1)
    expect(res.workHour.profileId).toBe('p1')
  })

  it('finds work hours by profile', async () => {
    const token = {
      sub: 'p2',
      unitId: 'unit-1',
      organizationId: 'org-1',
      role: 'BARBER',
      permissions: [PermissionName.MANAGE_SELF_WORK_HOURS],
    }
    await service.execute(token, {
      profileId: 'p2',
      weekDay: 1,
      startHour: '08:00',
      endHour: '10:00',
    })
    await service.execute(token, {
      profileId: 'p2',
      weekDay: 2,
      startHour: '09:00',
      endHour: '12:00',
    })

    const items = await repo.findManyByProfile('p2')
    expect(items).toHaveLength(2)
  })

  it('throws when adding duplicate work hour', async () => {
    const token = {
      sub: 'p3',
      unitId: 'unit-1',
      organizationId: 'org-1',
      role: 'BARBER',
      permissions: [PermissionName.MANAGE_SELF_WORK_HOURS],
    }
    await service.execute(token, {
      profileId: 'p3',
      weekDay: 1,
      startHour: '09:00',
      endHour: '12:00',
    })

    await expect(
      service.execute(token, {
        profileId: 'p3',
        weekDay: 1,
        startHour: '09:00',
        endHour: '12:00',
      }),
    ).rejects.toThrow()
  })
})
