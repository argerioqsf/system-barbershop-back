import { CashRegisterRepository } from '@/repositories/cash-register-repository'
import { CashRegisterSession } from '@prisma/client'

interface CloseSessionRequest {
  sessionId: string
  finalAmount: number
}

interface CloseSessionResponse {
  session: CashRegisterSession
}

export class CloseSessionService {
  constructor(private repository: CashRegisterRepository) {}

  async execute({ sessionId, finalAmount }: CloseSessionRequest): Promise<CloseSessionResponse> {
    const session = await this.repository.close(sessionId, {
      finalAmount,
      closedAt: new Date(),
    })
    return { session }
  }
}
