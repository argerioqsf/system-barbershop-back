import { UsersRepository } from '@/repositories/users-repository'
import { hash } from 'bcryptjs'
import { UserAlreadyExistsError } from './errors/user-already-exists-error'

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
  }: usersCasesRequest) {
    const password_hash = await hash(password, 6)

    const userWithSameEmail = await this.usersRepository.findByEmail(email)

    if (userWithSameEmail) {
      throw new UserAlreadyExistsError()
    }

    await this.usersRepository.create({
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
  }
}
