import { UnitRepository } from '@/repositories/unit-repository'

export class DeleteUnitService {
  constructor(private repository: UnitRepository) {}

  async execute(id: string): Promise<void> {
    await this.repository.delete(id)
  }
}
