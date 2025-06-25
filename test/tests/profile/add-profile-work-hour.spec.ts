import { describe, it, expect, beforeEach } from 'vitest'
import { AddProfileWorkHourService } from '../../../src/services/profile/add-profile-work-hour'
import {
  FakeProfileWorkHourRepository,
  FakeProfilesRepository,
} from '../../helpers/fake-repositories'
import { PermissionName } from '@prisma/client'
import { makeProfile } from '../../factories/make-profile.factory'
import { defaultUser, defaultUnit } from '../../helpers/default-values'

describe('Add profile work hour service', () => {
  let repo: FakeProfileWorkHourRepository
  let service: AddProfileWorkHourService
  let profilesRepo: FakeProfilesRepository

  beforeEach(() => {
    repo = new FakeProfileWorkHourRepository()
    profilesRepo = new FakeProfilesRepository()
    profilesRepo.profiles = [
      makeProfile({ userId: 'p1' }),
      makeProfile({ userId: 'p2' }),
      makeProfile({ userId: 'p3' }),
    ].map((p) => ({
      ...p,
      user: { ...defaultUser, id: p.userId, unit: defaultUnit },
    }))
    service = new AddProfileWorkHourService(repo, profilesRepo)
  })

  it('adds work hour for profile', async () => {
    const token = {
      sub: 'p1',
      unitId: 'unit-1',
      organizationId: 'org-1',
      role: 'BARBER',
      permissions: [
        PermissionName.MANAGE_SELF_WORK_HOURS,
        PermissionName.MENAGE_USERS_WORKING_HOURS,
      ],
    }
    profileRepo.profiles.push({
      ...makeProfile('prof-1', token.sub),
      user: { id: token.sub, unit: { slotDuration: 30 } } as any,
    })
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
      permissions: [
        PermissionName.MANAGE_SELF_WORK_HOURS,
        PermissionName.MENAGE_USERS_WORKING_HOURS,
      ],
    }
    profileRepo.profiles.push({
      ...makeProfile('prof-2', token.sub),
      user: { id: token.sub, unit: { slotDuration: 30 } } as any,
    })
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
      permissions: [
        PermissionName.MANAGE_SELF_WORK_HOURS,
        PermissionName.MENAGE_USERS_WORKING_HOURS,
      ],
    }
    profileRepo.profiles.push({
      ...makeProfile('prof-3', token.sub),
      user: { id: token.sub, unit: { slotDuration: 30 } } as any,
    })
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
