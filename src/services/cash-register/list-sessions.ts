import {
  CashRegisterRepository,
  DetailedCashSession,
} from '@/repositories/cash-register-repository'

interface ListSessionsResponse {
  sessions: DetailedCashSession[]
}

export class ListSessionsService {
  constructor(private repository: CashRegisterRepository) {}

  async execute(): Promise<ListSessionsResponse> {
    const sessions = await this.repository.findMany()
    return { sessions }
  }
}
