import { UsersRepository } from '@/repositories/users-repository'
import { Prisma, Profile, User } from '@prisma/client'

interface GetIndicatorProfileServiceRequest {
  page: number
  name?: string
  amountToReceive?: number | null | { gt: number }
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
    amountToReceive,
  }: GetIndicatorProfileServiceRequest): Promise<GetIndicatorProfileServiceResponse> {
    const where: Prisma.UserWhereInput = {
      name: { contains: name },
      profile: {
        role: 'indicator',
        amountToReceive,
      },
    }
    const users = await this.userRepository.findManyIndicator(page, where)
    const count = await this.userRepository.countIndicator(where)

    return { users, count }
  }
}
