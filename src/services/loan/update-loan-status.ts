import { LoanRepository } from '@/repositories/loan-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { UnitRepository } from '@/repositories/unit-repository'
import { TransactionRepository } from '@/repositories/transaction-repository'
import { LoanStatus, Transaction } from '@prisma/client'
import { IncrementBalanceProfileService } from '../profile/increment-balance'
import { IncrementBalanceUnitService } from '../unit/increment-balance'

interface UpdateLoanStatusRequest {
  loanId: string
  status: LoanStatus
  updatedById: string
}

export class UpdateLoanStatusService {
  constructor(
    private loanRepository: LoanRepository,
    private profileRepository: ProfilesRepository,
    private unitRepository: UnitRepository,
    private transactionRepository: TransactionRepository,
  ) {}

  async execute({ loanId, status, updatedById }: UpdateLoanStatusRequest) {
    const loan = await this.loanRepository.findById(loanId)
    if (!loan) throw new Error('Loan not found')

    const updated = await this.loanRepository.update(loanId, {
      status,
      updatedById,
    })

    const transactions: Transaction[] = []

    if (status === LoanStatus.APPROVED) {
      const incProfile = new IncrementBalanceProfileService(
        this.profileRepository,
      )
      const incUnit = new IncrementBalanceUnitService(
        this.unitRepository,
        this.transactionRepository,
      )
      const txProfile = await incProfile.execute(
        loan.userId,
        -loan.amount,
        undefined,
        true,
        'Loan withdrawal',
        undefined,
        undefined,
        loan.id,
      )
      const txUnit = await incUnit.execute(
        loan.unitId,
        loan.userId,
        -loan.amount,
        undefined,
        true,
        loan.id,
      )
      transactions.push(txProfile.transaction, txUnit.transaction)
    }

    return { loan: updated, transactions }
  }
}
