import { BarberUsersRepository } from '@/repositories/barber-users-repository'

interface DeleteUserRequest {
  id: string
}

export class DeleteUserService {
  constructor(private repository: BarberUsersRepository) {}

  async execute({ id }: DeleteUserRequest): Promise<void> {
    await this.repository.delete(id)
  }
}
