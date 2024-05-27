import { UsersRepository } from '@/repositories/users-repository'
import { User } from '@prisma/client'
import { UserNotFoundError } from '../@errors/user-not-found-error'

interface MountSelectIndicatorResponse {
  users: Omit<User, 'email' | 'password' | 'active'>[]
}

export class MountSelectIndicatorService {
  constructor(private userRepository: UsersRepository) {}

  async execute(): Promise<MountSelectIndicatorResponse> {
    const users = await this.userRepository.mountSelectIndicator()

    if (!users) {
      throw new UserNotFoundError()
    }

    return { users }
  }
}
