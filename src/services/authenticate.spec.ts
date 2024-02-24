import { InMemoryUserRepository } from '@/repositories/in-memory/in-memory-users-repository'
import { hash } from 'bcryptjs'
import { beforeEach, describe, expect, it } from 'vitest'
import { AuthenticateService } from './authenticate_service'
import { InvalidCredentialsError } from './errors/invalid-credentials-error'

let usersRepository: InMemoryUserRepository
let sut: AuthenticateService

describe('Authentication use case', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUserRepository()
    sut = new AuthenticateService(usersRepository)
  })

  it('create user authentication', async () => {
    await usersRepository.create({
      name: 'Joe Doe',
      email: 'joedoe@exemple.com',
      password: await hash('123456', 6),
    })

    const { user } = await sut.execute({
      email: 'joedoe@exemple.com',
      password: '123456',
    })

    expect(user.id).toEqual(expect.any(String))
  })

  it('authentication with wrong email', async () => {
    expect(() =>
      sut.execute({
        email: 'joedoe@exemple.com',
        password: '121212',
      }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError)
  })

  it('authentication with wrong password', async () => {
    await usersRepository.create({
      name: 'Joe Doe',
      email: 'joedoe@exemple.com',
      password: await hash('123456', 6),
    })

    expect(() =>
      sut.execute({
        email: 'joedoe@exemple.com',
        password: '121212',
      }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError)
  })
})
