import { LoanRepository } from '@/repositories/loan-repository'

export class ListUserLoansService {
  constructor(private loanRepository: LoanRepository) {}

  async execute({ userId }: { userId: string }) {
    const loans = await this.loanRepository.findMany({ userId })
    return loans
  }
}
