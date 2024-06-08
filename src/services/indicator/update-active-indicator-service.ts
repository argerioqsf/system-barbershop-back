import { UsersRepository } from '@/repositories/users-repository'
import { User } from '@prisma/client'
import { UserNotFoundError } from '../@errors/user-not-found-error'
import { sendActiveIndicatorEmail } from '@/lib/sendgrid'

interface UpdateActiveIndicatorServiceRequest {
  id: string
  active: boolean
}

interface UpdateActiveIndicatorServiceResponse {
  user: Omit<User, 'password'>
}

export class UpdateActiveIndicatorService {
  constructor(private userRepository: UsersRepository) {}

  async execute({
    id,
    active,
  }: UpdateActiveIndicatorServiceRequest): Promise<UpdateActiveIndicatorServiceResponse> {
    const findUser = await this.userRepository.findById(id)

    if (!findUser) throw new UserNotFoundError()

    const user = await this.userRepository.update(id, { active })

    if (active) sendActiveIndicatorEmail(findUser.email, findUser.name)

    return {
      user,
    }
  }
}
