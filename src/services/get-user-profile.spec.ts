import { InMemoryUserRepository } from '@/repositories/in-memory/in-memory-users-repository'
import { hash } from 'bcryptjs'
import { beforeEach, describe, expect, it } from 'vitest'
import { GetUserProfileService } from './get-user-profile-service'
import { InvalidCredentialsError } from './errors/invalid-credentials-error'
import { ResourceNotFoundError } from './errors/resource-not-found-error'

let usersRepository: InMemoryUserRepository
let sut: GetUserProfileService

describe('get profile user service', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUserRepository()
    sut = new GetUserProfileService(usersRepository)
  })

  it('get user profile', async () => {
    const createUser = await usersRepository.create({
      name: 'Joe Doe',
      email: 'joedoe@exemple.com',
      password: await hash('123456', 6),
    })

    const { user } = await sut.execute({
      userId: createUser.id,
    })

    expect(user.name).toEqual('Joe Doe')
  })

  it('get user profile not exist', async () => {
    expect(() =>
      sut.execute({
        userId: 'non-existing-id',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError)
  })
})
