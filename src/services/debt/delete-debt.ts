import { DebtRepository } from '@/repositories/debt-repository'

interface DeleteDebtRequest {
  id: string
}

export class DeleteDebtService {
  constructor(private repository: DebtRepository) {}

  async execute({ id }: DeleteDebtRequest): Promise<void> {
    await this.repository.delete(id)
  }
}
