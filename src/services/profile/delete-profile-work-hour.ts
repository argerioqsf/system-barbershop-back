import { ProfileWorkHourRepository } from '@/repositories/profile-work-hour-repository'

interface DeleteProfileWorkHourRequest {
  id: string
}

export class DeleteProfileWorkHourService {
  constructor(private repository: ProfileWorkHourRepository) {}

  async execute({ id }: DeleteProfileWorkHourRequest): Promise<void> {
    await this.repository.delete(id)
  }
}
