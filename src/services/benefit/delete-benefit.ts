import { BenefitRepository } from '@/repositories/benefit-repository'

interface DeleteBenefitRequest {
  id: string
}

export class DeleteBenefitService {
  constructor(private repository: BenefitRepository) {}

  async execute({ id }: DeleteBenefitRequest): Promise<void> {
    await this.repository.delete(id)
  }
}
