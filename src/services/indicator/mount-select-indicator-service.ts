import { UsersRepository } from '@/repositories/users-repository'
import { User } from '@prisma/client'
import { UserNotFoundError } from '../@errors/user-not-found-error'

interface MountSelectIndicatorResponse {
  user: Omit<User, 'email' | 'password' | 'active'>[]
}

export class MountSelectIndicatorService {
  constructor(private userRepository: UsersRepository) {}

  async execute(): Promise<MountSelectIndicatorResponse> {
    const user = await this.userRepository.mountSelectIndicator()

    if (!user) {
      throw new UserNotFoundError()
    }

    return { user }
  }
}
