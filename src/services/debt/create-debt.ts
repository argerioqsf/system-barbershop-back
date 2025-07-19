import { DebtRepository } from '@/repositories/debt-repository'
import { Debt, PaymentStatus } from '@prisma/client'

interface CreateDebtRequest {
  value: number
  planId: string
  planProfileId: string
  paymentDate: Date
  status?: PaymentStatus
}

interface CreateDebtResponse {
  debt: Debt
}

export class CreateDebtService {
  constructor(private repository: DebtRepository) {}

  async execute({
    value,
    planId,
    planProfileId,
    paymentDate,
    status = PaymentStatus.PENDING,
  }: CreateDebtRequest): Promise<CreateDebtResponse> {
    const debt = await this.repository.create({
      value,
      planId,
      planProfileId,
      paymentDate,
      status,
    })
    return { debt }
  }
}
