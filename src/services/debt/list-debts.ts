import { DebtRepository } from '@/repositories/debt-repository'
import { Debt } from '@prisma/client'

interface ListDebtsResponse {
  debts: Debt[]
}

export class ListDebtsService {
  constructor(private repository: DebtRepository) {}

  async execute(): Promise<ListDebtsResponse> {
    const debts = await this.repository.findMany()
    return { debts }
  }
}
