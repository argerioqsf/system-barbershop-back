import { UsersRepository } from '@/repositories/users-repository'
import { Prisma, Profile, User } from '@prisma/client'

interface GetUsersServiceRequest {
  page: number
  name?: string
}

interface GetUsersServiceResponse {
  users: (Omit<User, 'password'> & {
    profile: Omit<Profile, 'userId'> | null
  })[]
  count: number
}

export class GetUsersService {
  constructor(private userRepository: UsersRepository) {}

  async execute({
    page,
    name,
  }: GetUsersServiceRequest): Promise<GetUsersServiceResponse> {
    const where: Prisma.UserWhereInput = {
      name: { contains: name },
    }
    const users = await this.userRepository.findMany(page, where)
    const count = await this.userRepository.count(where)

    return { users, count }
  }
}
