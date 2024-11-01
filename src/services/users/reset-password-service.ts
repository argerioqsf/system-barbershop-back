import { UsersRepository } from '@/repositories/users-repository'
import { User } from '@prisma/client'
import { hash } from 'bcryptjs'
import { UserNotFoundError } from '../@errors/user-not-found-error'
import { InvalidCredentialsError } from '../@errors/invalid-credentials-error'
import { ProfileNotFoundError } from '../@errors/profile-not-found-error'

interface resetPasswordRequest {
  email: string
  password: string
  userId: string
}

interface ResetPasswordServiceResponse {
  user: Omit<User, 'password'>
}

export class ResetPasswordService {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    email,
    password,
    userId,
  }: resetPasswordRequest): Promise<ResetPasswordServiceResponse> {
    const password_hash = await hash(password, 6)

    const userWithEmail = await this.usersRepository.findByEmail(email)
    const user = await this.usersRepository.findById(userId)

    if (!userWithEmail) {
      throw new ProfileNotFoundError()
    }

    if (!user) {
      throw new UserNotFoundError()
    }

    if (user?.profile?.role !== 'administrator') {
      throw new InvalidCredentialsError()
    }

    const userUpdate = await this.usersRepository.update(userWithEmail.id, {
      password: password_hash,
    })

    return {
      user: userUpdate,
    }
  }
}
