import { describe, it, expect, beforeEach } from 'vitest'
import { GetUserProfileFromUserIdService } from '../../../src/services/profile/get-profile-from-userId-service'
import { FakeProfilesRepository } from '../../helpers/fake-repositories'
import { makeProfile } from '../../helpers/default-values'
import { ResourceNotFoundError } from '../../../src/services/@errors/common/resource-not-found-error'

describe('Get profile from user id service', () => {
  let repo: FakeProfilesRepository
  let service: GetUserProfileFromUserIdService

  beforeEach(() => {
    repo = new FakeProfilesRepository()
    service = new GetUserProfileFromUserIdService(repo)
  })

  it('returns profile', async () => {
    repo.profiles.push(makeProfile('p1', 'u1'))
    const res = await service.execute({ id: 'u1' })
    expect(res.profile?.id).toBe('p1')
  })

  it('throws when not found', async () => {
    await expect(service.execute({ id: 'no' })).rejects.toBeInstanceOf(
      ResourceNotFoundError,
    )
  })
})
