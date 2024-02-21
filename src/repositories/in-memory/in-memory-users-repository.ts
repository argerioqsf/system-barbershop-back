import { Prisma, User } from '@prisma/client'
import { UsersRepository } from '../users-repository'

export class InMemoryUserRepository implements UsersRepository {
  public items: User[] = []
  async findByEmail(email: string) {
    const user = this.items.find((item) => item.email === email)

    if (!user) {
      return null
    }

    return user
  }

  async create(data: Prisma.UserCreateInput) {
    const user = {
      id: 'user-1',
      firstName: data.firstName,
      lastName: data.lastName,
      cpf: data.cpf,
      dateOfBirth: data.dateOfBirth,
      email: data.email,
      gender: data.gender,
      password: data.password,
      phone: data.phone,
      role: data.role,
      status: data.status,
    }
    this.items.push(user)

    return user
  }
}
