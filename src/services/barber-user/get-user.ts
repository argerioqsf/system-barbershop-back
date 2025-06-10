import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { Profile, User } from '@prisma/client'

interface GetUserRequest {
  id: string
}

interface GetUserResponse {
  user: (User & { profile: Profile | null }) | null
}

export class GetUserService {
  constructor(private repository: BarberUsersRepository) {}

  async execute({ id }: GetUserRequest): Promise<GetUserResponse> {
    const user = await this.repository.findById(id)
    return { user }
  }
}
