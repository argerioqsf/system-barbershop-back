import { UsersRepository } from '@/repositories/users-repository'
import { Profile, User } from '@prisma/client'
import { ConsultantNotFoundError } from '../@errors/consultant-not-found-error'
import { UserNotFoundError } from '../@errors/user-not-found-error'

interface GetConsultantServiceRequest {
  id: string
}

interface GetUserServiceResponse {
  user: Omit<User, 'password'> & { profile: Omit<Profile, 'userId'> | null }
}

export class GetConsultantService {
  constructor(private userRepository: UsersRepository) {}

  async execute({
    id,
  }: GetConsultantServiceRequest): Promise<GetUserServiceResponse> {
    const user = await this.userRepository.findById(id)

    if (!user) throw new UserNotFoundError()

    if (user.profile && user.profile.role === 'consultant') {
      return { user }
    } else {
      throw new ConsultantNotFoundError()
    }
  }
}
