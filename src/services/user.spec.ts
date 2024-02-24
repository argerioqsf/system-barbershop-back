import { beforeEach, describe, expect, it } from 'vitest'
import { UserService } from './users-services'
import { compare } from 'bcryptjs'
import { InMemoryUserRepository } from '@/repositories/in-memory/in-memory-users-repository'
import { UserAlreadyExistsError } from './errors/user-already-exists-error'

let usersRepository: InMemoryUserRepository
let stu: UserService

describe('Users use case', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUserRepository()
    stu = new UserService(usersRepository)
  })

  it('create user', async () => {
    const { user } = await stu.execute({
      name: 'joe',
      email: 'joedoe@dev.com',
      password: '123456789A@',
    })

    expect(user.id).toEqual(expect.any(String))
  })

  it('user need password hash', async () => {
    const { user } = await stu.execute({
      name: 'joe',
      email: 'joedoe@dev.com',
      password: '123456789A@',
    })

    const isPasswordCorrectlyHashed = await compare(
      '123456789A@',
      user.password,
    )

    expect(isPasswordCorrectlyHashed).toBe(true)
  })

  it('you cannot register the same email', async () => {
    const email = 'johndoe@exemple.com'

    await stu.execute({
      name: 'joe',
      email,
      password: '123456789A@',
    })

    await expect(() =>
      stu.execute({
        name: 'joe',
        email,
        password: '123456789A@',
      }),
    ).rejects.toBeInstanceOf(UserAlreadyExistsError)
  })
})
