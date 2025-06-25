import { describe, it, expect, beforeEach } from 'vitest'
import { AddProfileBlockedHourService } from '../../../src/services/profile/add-profile-blocked-hour'
import { AddProfileWorkHourService } from '../../../src/services/profile/add-profile-work-hour'
import { AddUnitOpeningHourService } from '../../../src/services/unit/add-unit-opening-hour'
import { PermissionName } from '@prisma/client'
import {
  FakeUnitOpeningHourRepository,
  FakeProfileWorkHourRepository,
  FakeProfileBlockedHourRepository,
  FakeProfilesRepository,
} from '../../helpers/fake-repositories'
import { makeProfile } from '../../factories/make-profile.factory'
import { defaultUser, defaultUnit } from '../../helpers/default-values'

describe('Add profile blocked hour', () => {
  let unitRelRepo: FakeUnitOpeningHourRepository
  let workRepo: FakeProfileWorkHourRepository
  let blockedRepo: FakeProfileBlockedHourRepository
  let profilesRepo: FakeProfilesRepository
  let addUnitHour: AddUnitOpeningHourService
  let addWorkHour: AddProfileWorkHourService
  let addBlocked: AddProfileBlockedHourService

  beforeEach(() => {
    unitRelRepo = new FakeUnitOpeningHourRepository()
    workRepo = new FakeProfileWorkHourRepository()
    blockedRepo = new FakeProfileBlockedHourRepository()
    profilesRepo = new FakeProfilesRepository()
    profilesRepo.profiles = [
      makeProfile({ userId: 'prof-1' }),
      makeProfile({ userId: 'prof-2' }),
    ].map((p) => ({
      ...p,
      user: { ...defaultUser, id: p.userId, unit: defaultUnit },
    }))
    addUnitHour = new AddUnitOpeningHourService(unitRelRepo)
    addWorkHour = new AddProfileWorkHourService(workRepo, profilesRepo)
    addBlocked = new AddProfileBlockedHourService(
      blockedRepo,
      workRepo,
      profilesRepo,
    )
  })

  it('blocks hour when in work hours', async () => {
    await addUnitHour.execute({
      unitId: 'unit-1',
      weekDay: 1,
      startHour: '08:00',
      endHour: '12:00',
    })
    const token = {
      sub: 'prof-1',
      unitId: 'unit-1',
      organizationId: 'org-1',
      role: 'BARBER',
      permissions: [
        PermissionName.MANAGE_SELF_WORK_HOURS,
        PermissionName.MENAGE_USERS_WORKING_HOURS,
      ],
    }
    const tokenBlock = {
      sub: 'prof-1',
      unitId: 'unit-1',
      organizationId: 'org-1',
      role: 'BARBER',
      permissions: [
        PermissionName.MANAGE_SELF_BLOCKED_HOURS,
        PermissionName.MENAGE_USERS_BLOCKED_HOURS,
      ],
    }
    await addWorkHour.execute(token, {
      profileId: 'prof-1',
      weekDay: 1,
      startHour: '08:00',
      endHour: '12:00',
    })
    const res = await addBlocked.execute(tokenBlock, {
      profileId: 'prof-1',
      startHour: new Date('2024-01-01T08:00:00'),
      endHour: new Date('2024-01-01T12:00:00'),
    })
    expect(res.blocked.startHour.getHours()).toBe(8)
    expect(blockedRepo.items).toHaveLength(1)
  })

  it('throws if hour not in work hours', async () => {
    const token = {
      sub: 'prof-1',
      unitId: 'unit-1',
      organizationId: 'org-1',
      role: 'BARBER',
      permissions: [
        PermissionName.MANAGE_SELF_BLOCKED_HOURS,
        PermissionName.MENAGE_USERS_BLOCKED_HOURS,
      ],
    }
    await expect(
      addBlocked.execute(token, {
        profileId: 'prof-1',
        startHour: new Date('2024-01-02T09:00:00'),
        endHour: new Date('2024-01-02T12:00:00'),
      }),
    ).rejects.toThrow()
  })

  it('throws when blocking same hour twice', async () => {
    await addUnitHour.execute({
      unitId: 'unit-1',
      weekDay: 3,
      startHour: '10:00',
      endHour: '12:00',
    })
    const tokenWork = {
      sub: 'prof-2',
      unitId: 'unit-1',
      organizationId: 'org-1',
      role: 'BARBER',
      permissions: [
        PermissionName.MANAGE_SELF_WORK_HOURS,
        PermissionName.MENAGE_USERS_WORKING_HOURS,
      ],
    }
    const tokenBlock = {
      sub: 'prof-2',
      unitId: 'unit-1',
      organizationId: 'org-1',
      role: 'BARBER',
      permissions: [
        PermissionName.MANAGE_SELF_BLOCKED_HOURS,
        PermissionName.MENAGE_USERS_BLOCKED_HOURS,
      ],
    }
    await addWorkHour.execute(tokenWork, {
      profileId: 'prof-2',
      weekDay: 3,
      startHour: '10:00',
      endHour: '12:00',
    })
    await addBlocked.execute(tokenBlock, {
      profileId: 'prof-2',
      startHour: new Date('2024-01-03T10:00:00'),
      endHour: new Date('2024-01-03T12:00:00'),
    })

    await expect(
      addBlocked.execute(tokenBlock, {
        profileId: 'prof-2',
        startHour: new Date('2024-01-03T10:00:00'),
        endHour: new Date('2024-01-03T12:00:00'),
      }),
    ).rejects.toThrow()
  })
})
