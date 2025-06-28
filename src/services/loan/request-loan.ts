import { LoanRequestRepository } from '@/repositories/loan-request-repository'

interface RequestLoanInput {
  userId: string
  unitId: string
  amount: number
}

export class RequestLoanService {
  constructor(private repository: LoanRequestRepository) {}

  async execute(data: RequestLoanInput) {
    const loan = await this.repository.create({
      userId: data.userId,
      unitId: data.unitId,
      amount: data.amount,
      status: 'PENDING',
    })
    return { loan }
  }
}
