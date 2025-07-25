import { DebtRepository } from '@/repositories/debt-repository'
import { Debt, Prisma } from '@prisma/client'

interface UpdateDebtRequest {
  id: string
  data: Prisma.DebtUncheckedUpdateInput
}

interface UpdateDebtResponse {
  debt: Debt
}

export class UpdateDebtService {
  constructor(private repository: DebtRepository) {}

  async execute({ id, data }: UpdateDebtRequest): Promise<UpdateDebtResponse> {
    const debt = await this.repository.update(id, data)
    return { debt }
  }
}
