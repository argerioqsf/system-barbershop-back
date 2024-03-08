import { beforeEach, describe, expect, it } from 'vitest'
import { RegisterService } from './register-services'
import { compare } from 'bcryptjs'
import { InMemoryUserRepository } from '@/repositories/in-memory/in-memory-users-repository'
import { UserAlreadyExistsError } from './errors/user-already-exists-error'

let registerRepository: InMemoryUserRepository
let stu: RegisterService

describe('Users use case', () => {
  beforeEach(() => {
    registerRepository = new InMemoryUserRepository()
    stu = new RegisterService(registerRepository)
  })

  it('create user', async () => {
    const { user } = await stu.execute({
      name: 'joe',
      email: 'joedoe@dev.com',
      password: '123456789A@',
      active: false,
    })

    expect(user.id).toEqual(expect.any(String))
  })

  it('user need password hash', async () => {
    const { user } = await stu.execute({
      name: 'joe',
      email: 'joedoe@dev.com',
      password: '123456789A@',
      active: false,
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
      active: false,
    })

    await expect(() =>
      stu.execute({
        name: 'joe',
        email,
        password: '123456789A@',
        active: false,
      }),
    ).rejects.toBeInstanceOf(UserAlreadyExistsError)
  })
})
