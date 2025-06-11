import { OrganizationRepository } from '@/repositories/organization-repository'

export class DeleteOrganizationService {
  constructor(private repository: OrganizationRepository) {}

  async execute(id: string): Promise<void> {
    await this.repository.delete(id)
  }
}
