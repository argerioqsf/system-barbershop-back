import { CashRegisterRepository } from '@/repositories/cash-register-repository'
import { CashRegisterSession } from '@prisma/client'

interface ListSessionsResponse {
  sessions: CashRegisterSession[]
}

export class ListSessionsService {
  constructor(private repository: CashRegisterRepository) {}

  async execute(unitId: string): Promise<ListSessionsResponse> {
    const sessions = await this.repository.findManyByUnit(unitId)
    return { sessions }
  }
}
