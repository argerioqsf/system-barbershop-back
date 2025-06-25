import { describe, it, expect, beforeEach } from 'vitest'
import { AddProfileWorkHourService } from '../../../src/services/profile/add-profile-work-hour'
import {
  FakeProfileWorkHourRepository,
  FakeProfilesRepository,
  FakeUnitOpeningHourRepository,
} from '../../helpers/fake-repositories'
import { AddUnitOpeningHourService } from '../../../src/services/unit/add-unit-opening-hour'
import { makeProfile } from '../../helpers/default-values'
import { PermissionName } from '@prisma/client'

describe('Add profile work hour service', () => {
  let repo: FakeProfileWorkHourRepository
  let service: AddProfileWorkHourService
  let profileRepo: FakeProfilesRepository
  let unitRepo: FakeUnitOpeningHourRepository
  let addUnitHour: AddUnitOpeningHourService

  beforeEach(() => {
    repo = new FakeProfileWorkHourRepository()
    profileRepo = new FakeProfilesRepository()
    unitRepo = new FakeUnitOpeningHourRepository()
    addUnitHour = new AddUnitOpeningHourService(unitRepo)
    service = new AddProfileWorkHourService(repo, profileRepo, unitRepo)
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
    await addUnitHour.execute({
      unitId: token.unitId,
      weekDay: 1,
      startHour: '08:00',
      endHour: '12:00',
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
    await addUnitHour.execute({
      unitId: token.unitId,
      weekDay: 1,
      startHour: '08:00',
      endHour: '12:00',
    })
    await addUnitHour.execute({
      unitId: token.unitId,
      weekDay: 2,
      startHour: '08:00',
      endHour: '12:00',
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
    await addUnitHour.execute({
      unitId: token.unitId,
      weekDay: 1,
      startHour: '08:00',
      endHour: '12:00',
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

  it('throws when hour outside unit opening hours', async () => {
    const token = {
      sub: 'p4',
      unitId: 'unit-1',
      organizationId: 'org-1',
      role: 'BARBER',
      permissions: [
        PermissionName.MANAGE_SELF_WORK_HOURS,
        PermissionName.MENAGE_USERS_WORKING_HOURS,
      ],
    }
    profileRepo.profiles.push({
      ...makeProfile('prof-4', token.sub),
      user: { id: token.sub, unit: { slotDuration: 30 } } as any,
    })
    await addUnitHour.execute({
      unitId: token.unitId,
      weekDay: 2,
      startHour: '10:00',
      endHour: '12:00',
    })

    await expect(
      service.execute(token, {
        profileId: 'p4',
        weekDay: 2,
        startHour: '08:00',
        endHour: '09:00',
      }),
    ).rejects.toThrow()
  })
})
