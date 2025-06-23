import { describe, it, expect, beforeEach } from 'vitest'
import { GetUserService } from '../../../src/services/barber-user/get-user'
import { InMemoryBarberUsersRepository } from '../../helpers/fake-repositories'
import { makeUser } from '../../factories/make-user.factory'
import { makeProfile } from '../../factories/make-profile.factory'

describe('Get user service', () => {
  let repo: InMemoryBarberUsersRepository
  let service: GetUserService

  beforeEach(() => {
    repo = new InMemoryBarberUsersRepository()
    service = new GetUserService(repo)
  })

  it('returns user by id', async () => {
    const user = makeUser()
    const profile = { ...makeProfile({ userId: user.id }), workHours: [], blockedHours: [] }
    repo.users.push({ ...user, profile } as any)

    const res = await service.execute({ id: user.id })
    expect(res.user?.id).toBe(user.id)
    expect(res.user?.profile?.workHours).toBeDefined()
    expect(res.user?.profile?.blockedHours).toBeDefined()
  })

  it('returns null when not found', async () => {
    const res = await service.execute({ id: 'no' })
    expect(res.user).toBeNull()
  })
})
