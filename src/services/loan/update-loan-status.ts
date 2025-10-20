import { LoanRepository } from '@/repositories/loan-repository'
import { UnitRepository } from '@/repositories/unit-repository'
import {
  LoanStatus,
  ReasonTransaction,
  RoleName,
  Transaction,
} from '@prisma/client'
import { IncrementBalanceUnitService } from '../unit/increment-balance'
import { UnauthorizedError } from '../@errors/auth/unauthorized-error'
import { UserToken } from '@/http/controllers/authenticate-controller'

interface UpdateLoanStatusRequest {
  loanId: string
  status: LoanStatus
  updatedById: string
  user: UserToken
}

export class UpdateLoanStatusService {
  constructor(
    private loanRepository: LoanRepository,
    private unitRepository: UnitRepository,
  ) {}

  async execute({
    loanId,
    status,
    updatedById,
    user,
  }: UpdateLoanStatusRequest) {
    const loan = await this.loanRepository.findById(loanId)
    if (!loan) throw new Error('Loan not found')
    if (user.role === RoleName.MANAGER && loan.unitId !== user.unitId)
      throw new UnauthorizedError()

    const incUnit = new IncrementBalanceUnitService(this.unitRepository)

    const updated = await this.loanRepository.update(loanId, {
      status,
      updatedById,
    })

    const transactions: Transaction[] = []

    if (status === LoanStatus.VALUE_TRANSFERRED) {
      const txUnit = await incUnit.execute(
        loan.unitId,
        loan.userId,
        -loan.amount,
        undefined,
        true,
        loan.id,
        undefined,
        { reason: ReasonTransaction.PAY_LOAN },
      )
      transactions.push(txUnit.transaction)
    }

    return { loan: updated, transactions }
  }
}
