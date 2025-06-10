import { CashRegisterRepository } from '@/repositories/cash-register-repository'
import { CashRegisterSession } from '@prisma/client'

interface ListSessionsResponse {
  sessions: CashRegisterSession[]
}

export class ListSessionsService {
  constructor(private repository: CashRegisterRepository) {}

  async execute(): Promise<ListSessionsResponse> {
    const sessions = await this.repository.findMany()
    return { sessions }
  }
}
