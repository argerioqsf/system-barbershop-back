import { describe, it, expect, beforeEach } from 'vitest'
import { ListAvailableBarbersUseCase } from '../../../src/modules/appointment/application/use-cases/list-available-barbers'
import { InMemoryBarberUsersRepository } from '../../helpers/fake-repositories'
import { makeProfile, makeUser, makeUnit } from '../../helpers/default-values'
import {
  BarberService,
  Permission,
  PermissionCategory,
  PermissionName,
  Profile,
  ProfileBlockedHour,
  ProfileWorkHour,
  Role,
} from '@prisma/client'

describe('List appointment barbers use case', () => {
  let repo: InMemoryBarberUsersRepository
  let useCase: ListAvailableBarbersUseCase

  beforeEach(() => {
    const unit = makeUnit('unit-1')
    const profile1: Profile & {
      role: Role
      permissions: Permission[]
      workHours: ProfileWorkHour[]
      blockedHours: ProfileBlockedHour[]
      barberServices: BarberService[]
    } = { ...makeProfile('p1', 'u1'), permissions: [] }

    const profile2: Profile & {
      role: Role
      permissions: Permission[]
      workHours: ProfileWorkHour[]
      blockedHours: ProfileBlockedHour[]
      barberServices: BarberService[]
    } = {
      ...makeProfile('p2', 'u2'),
      permissions: [
        {
          id: 'perm',
          name: PermissionName.ACCEPT_APPOINTMENT,
          category: PermissionCategory.APPOINTMENT,
        },
      ],
    }
    repo = new InMemoryBarberUsersRepository([
      makeUser('u1', profile1, unit),
      makeUser('u2', profile2, unit),
    ])
    useCase = new ListAvailableBarbersUseCase(repo)
  })

  it('returns users that can be scheduled', async () => {
    const res = await useCase.execute({
      sub: 'admin',
      role: 'ADMIN',
      unitId: 'unit-1',
      organizationId: 'org-1',
    })
    expect(res.users).toHaveLength(1)
    expect(res.users[0].id).toBe('u2')
  })
})
