import { LoanRequestRepository } from '@/repositories/loan-request-repository'
import { LoanStatus } from '@prisma/client'

interface SetLoanStatusInput {
  id: string
  status: LoanStatus
}

export class SetLoanStatusService {
  constructor(private repository: LoanRequestRepository) {}

  async execute(data: SetLoanStatusInput) {
    const loan = await this.repository.update(data.id, { status: data.status })
    return { loan }
  }
}
