import { BarberUsersRepository } from '@/repositories/barber-users-repository'

type ExportedUser = Awaited<
  ReturnType<BarberUsersRepository['findMany']>
>[number]

interface ExportUsersResponse {
  users: ExportedUser[]
}

export class ExportUsersService {
  constructor(private repository: BarberUsersRepository) {}

  async execute(): Promise<ExportUsersResponse> {
    const users = await this.repository.findMany()
    return { users }
  }
}
