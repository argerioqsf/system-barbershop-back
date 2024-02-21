import { describe, expect, it } from 'vitest'
import { UserService } from './users-services'
import { compare } from 'bcryptjs'
import { InMemoryUserRepository } from '@/repositories/in-memory/in-memory-users-repository'
import { UserAlreadyExistsError } from './errors/user-already-exists-error'

describe('Users use case', () => {
  it('create user', async () => {
    const usersRepository = new InMemoryUserRepository()
    const userService = new UserService(usersRepository)

    const { user } = await userService.execute({
      firstName: 'joe',
      lastName: 'doe',
      cpf: '123123123',
      dateOfBirth: '12//111//112',
      email: 'joedoe@dev.com',
      gender: 'male',
      password: '123456789A@',
      phone: '+5533446',
      role: 'admin',
      status: 'pending',
    })

    expect(user.id).toEqual(expect.any(String))
  })

  it('user need password hash', async () => {
    const usersRepository = new InMemoryUserRepository()
    const userService = new UserService(usersRepository)

    const { user } = await userService.execute({
      firstName: 'joe',
      lastName: 'doe',
      cpf: '123123123',
      dateOfBirth: '12//111//112',
      email: 'joedoe@dev.com',
      gender: 'male',
      password: '123456789A@',
      phone: '+5533446',
      role: 'admin',
      status: 'pending',
    })

    const isPasswordCorrectlyHashed = await compare(
      '123456789A@',
      user.password,
    )

    expect(isPasswordCorrectlyHashed).toBe(true)
  })

  it('you cannot register the same email', async () => {
    const usersRepository = new InMemoryUserRepository()
    const registerUser = new UserService(usersRepository)

    const email = 'johndoe@exemple.com'

    await registerUser.execute({
      firstName: 'joe',
      lastName: 'doe',
      cpf: '123123123',
      dateOfBirth: '12//111//112',
      email,
      gender: 'male',
      password: '123456789A@',
      phone: '+5533446',
      role: 'admin',
      status: 'pending',
    })

    await expect(() =>
      registerUser.execute({
        firstName: 'joe',
        lastName: 'doe',
        cpf: '123123123',
        dateOfBirth: '12//111//112',
        email,
        gender: 'male',
        password: '123456789A@',
        phone: '+5533446',
        role: 'admin',
        status: 'pending',
      }),
    ).rejects.toBeInstanceOf(UserAlreadyExistsError)
  })
})
