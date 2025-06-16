import { describe, it, expect, beforeEach } from 'vitest'
import { DeleteUserService } from '../../../src/services/barber-user/delete-user'
import { InMemoryBarberUsersRepository } from '../../helpers/fake-repositories'
import { makeUser } from '../../factories/make-user.factory'
import { makeProfile } from '../../factories/make-profile.factory'

function makeStoredUser() {
  const user = makeUser()
  const profile = makeProfile({ userId: user.id })
  return { ...user, profile }
}

describe('Delete user service', () => {
  let repo: InMemoryBarberUsersRepository
  let service: DeleteUserService

  beforeEach(() => {
    repo = new InMemoryBarberUsersRepository()
    service = new DeleteUserService(repo)
  })

  it('deletes user', async () => {
    const stored = makeStoredUser()
    repo.users.push(stored as any)

    await service.execute({ id: stored.id })
    expect(repo.users).toHaveLength(0)
  })
})
