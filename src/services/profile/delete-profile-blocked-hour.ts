import { ProfileBlockedHourRepository } from '@/repositories/profile-blocked-hour-repository'

interface DeleteProfileBlockedHourRequest {
  id: string
}

export class DeleteProfileBlockedHourService {
  constructor(private repository: ProfileBlockedHourRepository) {}

  async execute({ id }: DeleteProfileBlockedHourRequest): Promise<void> {
    await this.repository.delete(id)
  }
}
