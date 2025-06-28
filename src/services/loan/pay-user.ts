import { WithdrawalBalanceTransactionService } from '@/services/transaction/withdrawal-balance-transaction'
import { LoanRequestRepository } from '@/repositories/loan-request-repository'
import { LoanStatus } from '@prisma/client'

interface PayUserInput {
  actorId: string
  userId: string
  amount: number
  description: string
}

export class PayUserService {
  constructor(
    private withdrawalService: WithdrawalBalanceTransactionService,
    private loanRepository: LoanRequestRepository,
  ) {}

  async execute(data: PayUserInput) {
    const { transactions } = await this.withdrawalService.execute({
      userId: data.actorId,
      affectedUserId: data.userId,
      amount: data.amount,
      description: data.description,
    })

    const loans = await this.loanRepository.findMany({
      userId: data.userId,
      status: LoanStatus.ACCEPTED,
    })

    for (const loan of loans) {
      await this.loanRepository.update(loan.id, { status: LoanStatus.DEDUCTED })
    }

    return { transactions }
  }
}
