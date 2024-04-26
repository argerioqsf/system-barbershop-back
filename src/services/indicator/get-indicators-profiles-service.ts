import { UsersRepository } from '@/repositories/users-repository'
import { Profile, User } from '@prisma/client'

interface GetIndicatorProfileServiceRequest {
  page: number
  query?: string
}

interface GetIndicatorProfileServiceResponse {
  users: (Omit<User, 'password'> & {
    profile: Omit<Profile, 'userId'> | null
  })[]
  count: number
}

export class GetIndicatorProfileService {
  constructor(private userRepository: UsersRepository) {}

  async execute({
    page,
    query,
  }: GetIndicatorProfileServiceRequest): Promise<GetIndicatorProfileServiceResponse> {
    const users = await this.userRepository.findManyIndicator(page, query)
    const count = await this.userRepository.countIndicator(query)

    return { users, count }
  }
}
