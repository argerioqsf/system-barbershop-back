import { describe, it, expect, beforeEach } from 'vitest'
import { GetUserService } from '../../../src/services/barber-user/get-user'
import {
  InMemoryBarberUsersRepository,
  FakeAppointmentRepository,
  FakeDayHourRepository,
} from '../../helpers/fake-repositories'
import { makeUser } from '../../factories/make-user.factory'
import { makeProfile } from '../../factories/make-profile.factory'
import {
  BarberService,
  Permission,
  Profile,
  ProfileBlockedHour,
  ProfileWorkHour,
  Role,
} from '@prisma/client'

describe('Get user service', () => {
  let repo: InMemoryBarberUsersRepository
  let service: GetUserService
  let appointmentRepo: FakeAppointmentRepository
  let dayHourRepo: FakeDayHourRepository

  beforeEach(() => {
    repo = new InMemoryBarberUsersRepository()
    appointmentRepo = new FakeAppointmentRepository()
    dayHourRepo = new FakeDayHourRepository()
    service = new GetUserService(repo, appointmentRepo, dayHourRepo)
  })

  it('returns user by id', async () => {
    const user = makeUser()
    const profile: Profile & {
      role: Role
      permissions: Permission[]
      workHours: ProfileWorkHour[]
      blockedHours: ProfileBlockedHour[]
      barberServices: BarberService[]
    } = {
      ...makeProfile({ userId: user.id }),
      workHours: [],
      blockedHours: [],
    }
    repo.users.push({
      ...user,
      profile,
    })

    const res = await service.execute({ id: user.id })
    expect(res.user?.id).toBe(user.id)
    expect(res.user?.profile?.workHours).toBeDefined()
    expect(res.user?.profile?.blockedHours).toBeDefined()
    expect(res.user?.availableSlots).toEqual([])
  })

  it('returns null when not found', async () => {
    const res = await service.execute({ id: 'no' })
    expect(res.user).toBeNull()
  })
})
