import { InMemoryProfilesRepository } from '@/repositories/in-memory/in-memory-profiles-repository'
import { makeProfile } from 'test/factories/make-profile.factory'
import { beforeEach, describe, expect, it } from 'vitest'
import { GetUserProfileService } from './get-user-profile-service'
import { UserNotFoundError } from './errors/user-not-found-error'

describe('Get Profile Use Case', () => {
  let profileRepository: InMemoryProfilesRepository
  let sut: GetUserProfileService

  beforeEach(() => {
    profileRepository = new InMemoryProfilesRepository()
    sut = new GetUserProfileService(profileRepository)
  })

  it('should be able to get a new profile', async () => {
    const profile = await profileRepository.create(makeProfile())
    const result = await sut.execute({ id: profile.id })

    expect(result.profile).toEqual(profile)
  })
})
