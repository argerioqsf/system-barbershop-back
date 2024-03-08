import { InMemoryProfilesRepository } from '@/repositories/in-memory/in-memory-profiles-repository'
import { beforeEach, describe, expect, it } from 'vitest'
import { CreateProfileService } from './register-profile-service'
import { InMemoryUserRepository } from '@/repositories/in-memory/in-memory-users-repository'
import { makeUser } from 'test/factories/make-user.factory'
import { makeProfile } from 'test/factories/make-profile.factory'

describe('Profile use case', () => {
  let profileRepository: InMemoryProfilesRepository
  let userRepository: InMemoryUserRepository
  let stu: CreateProfileService

  beforeEach(() => {
    userRepository = new InMemoryUserRepository()
    profileRepository = new InMemoryProfilesRepository()
    stu = new CreateProfileService(userRepository, profileRepository)
  })

  it('create profile', async () => {
    const user = await userRepository.create(makeUser())
    const { profile } = await stu.execute(makeProfile({ userId: user.id }))

    expect(profileRepository.items).toHaveLength(1)
    expect(profile.id).toEqual(expect.any(String))
  })
})
