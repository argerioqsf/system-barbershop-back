import { describe, it, expect, beforeEach } from 'vitest'
import { AddProfileBlockedHourService } from '../../../src/services/profile/add-profile-blocked-hour'
import { AddProfileWorkHourService } from '../../../src/services/profile/add-profile-work-hour'
import { CreateDayHourService } from '../../../src/services/day-hour/create-day-hour'
import { AddUnitDayHourService } from '../../../src/services/unit/add-unit-day-hour'
import { PermissionName } from '@prisma/client'
import {
  FakeDayHourRepository,
  FakeUnitDayHourRepository,
  FakeProfileWorkHourRepository,
  FakeProfileBlockedHourRepository,
} from '../../helpers/fake-repositories'

describe('Add profile blocked hour', () => {
  let dayHourRepo: FakeDayHourRepository
  let unitRelRepo: FakeUnitDayHourRepository
  let workRepo: FakeProfileWorkHourRepository
  let blockedRepo: FakeProfileBlockedHourRepository
  let createDayHour: CreateDayHourService
  let addUnitHour: AddUnitDayHourService
  let addWorkHour: AddProfileWorkHourService
  let addBlocked: AddProfileBlockedHourService

  beforeEach(() => {
    dayHourRepo = new FakeDayHourRepository()
    unitRelRepo = new FakeUnitDayHourRepository()
    workRepo = new FakeProfileWorkHourRepository()
    blockedRepo = new FakeProfileBlockedHourRepository()
    createDayHour = new CreateDayHourService(dayHourRepo)
    addUnitHour = new AddUnitDayHourService(unitRelRepo)
    addWorkHour = new AddProfileWorkHourService(workRepo)
    addBlocked = new AddProfileBlockedHourService(blockedRepo, workRepo)
  })

  it('blocks hour when in work hours', async () => {
    const { dayHour } = await createDayHour.execute({
      weekDay: 1,
      startHour: '08:00',
      endHour: '12:00',
    })
    await addUnitHour.execute({ unitId: 'unit-1', dayHourId: dayHour.id })
    const token: any = {
      sub: 'prof-1',
      unitId: 'unit-1',
      organizationId: 'org-1',
      role: 'BARBER',
      permissions: [PermissionName.MANAGE_SELF_WORK_HOURS],
    }
    const tokenBlock: any = {
      sub: 'prof-1',
      unitId: 'unit-1',
      organizationId: 'org-1',
      role: 'BARBER',
      permissions: [PermissionName.MANAGE_SELF_BLOCKED_HOURS],
    }
    await addWorkHour.execute(token, { profileId: 'prof-1', dayHourId: dayHour.id })
    const res = await addBlocked.execute(tokenBlock, { profileId: 'prof-1', dayHourId: dayHour.id })
    expect(res.blocked.dayHourId).toBe(dayHour.id)
    expect(blockedRepo.items).toHaveLength(1)
  })

  it('throws if hour not in work hours', async () => {
    const { dayHour } = await createDayHour.execute({
      weekDay: 2,
      startHour: '09:00',
      endHour: '12:00',
    })
    const token: any = {
      sub: 'prof-1',
      unitId: 'unit-1',
      organizationId: 'org-1',
      role: 'BARBER',
      permissions: [PermissionName.MANAGE_SELF_BLOCKED_HOURS],
    }
    await expect(
      addBlocked.execute(token, { profileId: 'prof-1', dayHourId: dayHour.id }),
    ).rejects.toThrow()
  })

  it('throws when blocking same hour twice', async () => {
    const { dayHour } = await createDayHour.execute({
      weekDay: 3,
      startHour: '10:00',
      endHour: '12:00',
    })
    await addUnitHour.execute({ unitId: 'unit-1', dayHourId: dayHour.id })
    const tokenWork: any = {
      sub: 'prof-2',
      unitId: 'unit-1',
      organizationId: 'org-1',
      role: 'BARBER',
      permissions: [PermissionName.MANAGE_SELF_WORK_HOURS],
    }
    const tokenBlock: any = {
      sub: 'prof-2',
      unitId: 'unit-1',
      organizationId: 'org-1',
      role: 'BARBER',
      permissions: [PermissionName.MANAGE_SELF_BLOCKED_HOURS],
    }
    await addWorkHour.execute(tokenWork, { profileId: 'prof-2', dayHourId: dayHour.id })
    await addBlocked.execute(tokenBlock, { profileId: 'prof-2', dayHourId: dayHour.id })

    await expect(
      addBlocked.execute(tokenBlock, { profileId: 'prof-2', dayHourId: dayHour.id }),
    ).rejects.toThrow()
  })
})
