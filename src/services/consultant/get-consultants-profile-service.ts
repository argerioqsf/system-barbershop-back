import { UsersRepository } from '@/repositories/users-repository'
import { Prisma, Profile, User } from '@prisma/client'

interface GetConsultantProfileServiceRequest {
  page: number
  name?: string
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
    name,
  }: GetConsultantProfileServiceRequest): Promise<GetConsultantProfileServiceResponse> {
    const where: Prisma.UserWhereInput = {
      name: { contains: name },
      profile: {
        role: 'consultant',
      },
    }
    const users = await this.userRepository.findManyConsultant(page, where)
    const count = await this.userRepository.countConsultant(where)

    return { users, count }
  }
}
