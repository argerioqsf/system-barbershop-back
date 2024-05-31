import { UsersRepository } from '@/repositories/users-repository'
import { Prisma, Profile, User } from '@prisma/client'

interface GetIndicatorProfileServiceRequest {
  page: number
  name?: string
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
    name,
  }: GetIndicatorProfileServiceRequest): Promise<GetIndicatorProfileServiceResponse> {
    const where: Prisma.UserWhereInput = {
      name: { contains: name },
      profile: {
        role: 'indicator',
      },
    }
    const users = await this.userRepository.findManyIndicator(page, where)
    const count = await this.userRepository.countIndicator(where)

    return { users, count }
  }
}
