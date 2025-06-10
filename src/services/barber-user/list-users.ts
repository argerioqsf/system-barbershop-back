import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { Profile, User } from '@prisma/client'

interface ListUsersResponse {
  users: (User & { profile: Profile | null })[]
}

export class ListUsersService {
  constructor(private repository: BarberUsersRepository) {}

  async execute(): Promise<ListUsersResponse> {
    const users = await this.repository.findMany()
    return { users }
  }
}
