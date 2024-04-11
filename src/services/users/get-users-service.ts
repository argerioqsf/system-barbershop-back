import { UsersRepository } from '@/repositories/users-repository'
import { User } from '@prisma/client'

interface GetUsersServiceRequest {
  page: number
}

interface GetUsersServiceResponse {
  users: object[]
}

export class GetUsersService {
  constructor(private userRepository: UsersRepository) {}

  async execute({
    page,
  }: GetUsersServiceRequest): Promise<GetUsersServiceResponse> {
    const users = await this.userRepository.findMany(page)

    return { users }
  }
}
