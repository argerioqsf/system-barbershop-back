import { UsersRepository } from '@/repositories/users-repository'
import { UserNotFoundError } from '../@errors/user-not-found-error'
import { Profile, User } from '@prisma/client'

interface GetUserServiceRequest {
  id: string
}

interface GetUserServiceResponse {
  user: Omit<User, 'password'> & { profile: Omit<Profile, 'userId'> | null }
}

export class GetUserService {
  constructor(private userRepository: UsersRepository) {}

  async execute({
    id,
  }: GetUserServiceRequest): Promise<GetUserServiceResponse> {
    const user = await this.userRepository.findById(id)

    if (!user) throw new UserNotFoundError()

    return { user }
  }
}
