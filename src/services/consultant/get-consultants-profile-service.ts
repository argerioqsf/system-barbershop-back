import { UsersRepository } from '@/repositories/users-repository'
import { Profile, User } from '@prisma/client'

interface GetConsultantProfileServiceRequest {
  page: number
  query?: string
}

interface GetConsultantProfileServiceResponse {
  users: (Omit<User, 'password'> & {
    profile: Omit<Profile, 'userId'> | null
  })[]
  count: number
}

export class GetConsultantProfileService {
  constructor(private userRepository: UsersRepository) {}

  async execute({
    page,
    query,
  }: GetConsultantProfileServiceRequest): Promise<GetConsultantProfileServiceResponse> {
    const users = await this.userRepository.findManyIndicator(page, query)
    const count = await this.userRepository.countIndicator(query)

    return { users, count }
  }
}
