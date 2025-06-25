import { UnitOpeningHourRepository } from '@/repositories/unit-opening-hour-repository'

interface DeleteUnitOpeningHourRequest {
  id: string
}

export class DeleteUnitOpeningHourService {
  constructor(private repository: UnitOpeningHourRepository) {}

  async execute({ id }: DeleteUnitOpeningHourRequest): Promise<void> {
    await this.repository.delete(id)
  }
}
