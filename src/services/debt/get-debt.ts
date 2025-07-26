import { DebtRepository } from '@/repositories/debt-repository'
import { Debt } from '@prisma/client'

interface GetDebtRequest {
  id: string
}

interface GetDebtResponse {
  debt: Debt | null
}

export class GetDebtService {
  constructor(private repository: DebtRepository) {}

  async execute({ id }: GetDebtRequest): Promise<GetDebtResponse> {
    const debt = await this.repository.findById(id)
    return { debt }
  }
}
