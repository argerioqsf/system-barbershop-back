import { UsersRepository } from '@/repositories/users-repository'
import { hash } from 'bcryptjs'
import { UserAlreadyExistsError } from './errors/user-already-exists-error'
import { User } from '@prisma/client'

interface usersCasesRequest {
  firstName: string
  lastName: string
  phone: string
  cpf: string
  dateOfBirth: string
  gender: string
  role: string
  status: string
  password: string
  email: string
}

interface RegisterUserService {
  user: User
}

export class UserService {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    firstName,
    lastName,
    phone,
    cpf,
    dateOfBirth,
    gender,
    role,
    status,
    password,
    email,
  }: usersCasesRequest): Promise<RegisterUserService> {
    const password_hash = await hash(password, 6)

    const userWithSameEmail = await this.usersRepository.findByEmail(email)

    if (userWithSameEmail) {
      throw new UserAlreadyExistsError()
    }

    const user = await this.usersRepository.create({
      firstName,
      lastName,
      phone,
      cpf,
      dateOfBirth,
      gender,
      role,
      status,
      password: password_hash,
      email,
    })

    return {
      user,
    }
  }
}
