import { BarberUsersRepository } from '@/repositories/barber-users-repository'

interface ExportUsersResponse {
  users: unknown[]
}

export class ExportUsersService {
  constructor(private repository: BarberUsersRepository) {}

  async execute(): Promise<ExportUsersResponse> {
    const users = await this.repository.findMany()
    return { users }
  }
}
