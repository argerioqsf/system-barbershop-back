import { CashRegisterRepository } from '@/repositories/cash-register-repository'
import { CashRegisterSession } from '@prisma/client'

interface OpenSessionRequest {
  userId: string
  initialAmount: number
}

interface OpenSessionResponse {
  session: CashRegisterSession
}

export class OpenSessionService {
  constructor(private repository: CashRegisterRepository) {}

  async execute({ userId, initialAmount }: OpenSessionRequest): Promise<OpenSessionResponse> {
    const session = await this.repository.create({
      openedBy: { connect: { id: userId } },
      initialAmount,
    })
    return { session }
  }
}
