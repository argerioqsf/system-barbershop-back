import { prisma } from '@/lib/prisma'
import { Prisma, Profile, User } from '@prisma/client'
import { UsersRepository } from '../users-repository'

export class PrismaUsersRepository implements UsersRepository {
  async findById(
    id: string,
  ): Promise<
    | (Omit<User, 'password'> & { profile: Omit<Profile, 'userId'> | null })
    | null
  > {
    const user = await prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        email: true,
        name: true,
        active: true,
        profile: {
          select: {
            id: true,
            cpf: true,
            genre: true,
            phone: true,
            role: true,
            pix: true,
            birthday: true,
          },
        },
      },
    })

    return user
  }

  async findByEmail(email: string) {
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
      include: {
        profile: true,
      },
    })
    return user
  }

  async create(data: Prisma.UserCreateInput) {
    const user = await prisma.user.create({
      data,
    })
    return user
  }

  async findMany(
    page: number,
    query?: string,
  ): Promise<
    (Omit<User, 'password'> & { profile: Omit<Profile, 'userId'> | null })[]
  > {
    const users = await prisma.user.findMany({
      where: {
        name: {
          contains: query,
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        active: true,
        profile: {
          select: {
            id: true,
            cpf: true,
            genre: true,
            phone: true,
            role: true,
            pix: true,
            birthday: true,
          },
        },
      },
      take: 10,
      skip: (page - 1) * 10,
    })

    return users
  }
}
