import { UsersRepository } from '@/repositories/users-repository'
import { Profile, User } from '@prisma/client'

interface GetUsersServiceRequest {
  page: number
  query?: string
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
    query,
  }: GetUsersServiceRequest): Promise<GetUsersServiceResponse> {
    const users = await this.userRepository.findMany(page, query)
    const count = await this.userRepository.count(query)

    return { users, count }
  }
}
