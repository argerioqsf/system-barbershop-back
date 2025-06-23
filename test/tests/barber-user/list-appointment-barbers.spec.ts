import { describe, it, expect, beforeEach } from 'vitest'
import { ListAppointmentBarbersService } from '../../../src/services/users/list-appointment-barbers'
import { InMemoryBarberUsersRepository } from '../../helpers/fake-repositories'
import { makeProfile, makeUser, makeUnit } from '../../helpers/default-values'
import { PermissionName } from '@prisma/client'

describe('List appointment barbers service', () => {
  let repo: InMemoryBarberUsersRepository
  let service: ListAppointmentBarbersService

  beforeEach(() => {
    const unit = makeUnit('unit-1')
    const profile1 = { ...makeProfile('p1', 'u1'), permissions: [] }
    const profile2 = {
      ...makeProfile('p2', 'u2'),
      permissions: [{ id: 'perm', name: PermissionName.ACCEPT_APPOINTMENT } as any],
    }
    repo = new InMemoryBarberUsersRepository([
      makeUser('u1', profile1, unit),
      makeUser('u2', profile2, unit),
    ])
    service = new ListAppointmentBarbersService(repo)
  })

  it('returns users that can be scheduled', async () => {
    const res = await service.execute({
      sub: 'admin',
      role: 'ADMIN',
      unitId: 'unit-1',
      organizationId: 'org-1',
    } as any)
    expect(res.users).toHaveLength(1)
    expect(res.users[0].id).toBe('u2')
  })
})
