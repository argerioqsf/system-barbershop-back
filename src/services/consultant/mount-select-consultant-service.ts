import { UsersRepository } from '@/repositories/users-repository'
import { User } from '@prisma/client'
import { UserNotFoundError } from '../@errors/user-not-found-error'

interface MountSelectConsultantResponse {
  user: Omit<User, 'email' | 'password' | 'active'>[]
}

export class MountSelectConsultantService {
  constructor(private userRepository: UsersRepository) {}

  async execute(): Promise<MountSelectConsultantResponse> {
    const user = await this.userRepository.mountSelectConsultant()

    if (!user) {
      throw new UserNotFoundError()
    }

    return { user }
  }
}
