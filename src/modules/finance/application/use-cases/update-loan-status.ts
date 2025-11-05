import { LoansRepositoryPort } from '@/modules/finance/application/ports/loans-repository'
import { LoanStatus } from '@/modules/finance/domain/types/status'
import { IncrementBalanceUnitService } from '@/services/unit/increment-balance'
import { TransactionReason } from '@/modules/finance/domain/entities/transaction'
import { Loan } from '@/modules/finance/domain/entities/loan'
import {
  UpdateLoanStatusDTO,
  UpdateLoanStatusOutput,
} from '../dto/update-loan-status.dto'
import { LoanNotFoundError } from '../errors/loan-not-found-error'

export class UpdateLoanStatusUseCase {
  constructor(
    private readonly loansRepository: LoansRepositoryPort,
    private readonly incrementUnitBalance: IncrementBalanceUnitService,
  ) {}

  async execute(command: UpdateLoanStatusDTO): Promise<UpdateLoanStatusOutput> {
    const loanRecord = await this.loansRepository.findById(command.loanId)
    if (!loanRecord) {
      throw new LoanNotFoundError()
    }

    const loan = Loan.create({
      id: loanRecord.id,
      unitId: loanRecord.unitId,
      userId: loanRecord.userId,
      sessionId: loanRecord.sessionId,
      amount: loanRecord.amount,
      status: command.status,
      createdAt: loanRecord.createdAt,
      paidAt: loanRecord.paidAt,
      updatedById: command.updatedById,
    })

    // TODO: colocar todas as alteracoes de DB dentro de uma transacao

    const updated = await this.loansRepository.update(loanRecord.id, {
      status: command.status,
      updatedById: command.updatedById,
    })

    if (loan.status !== LoanStatus.VALUE_TRANSFERRED) {
      return {
        loan: {
          id: updated.id,
          unitId: updated.unitId,
          userId: updated.userId,
          sessionId: updated.sessionId,
          amount: updated.amount,
          status: updated.status,
          createdAt: updated.createdAt,
          paidAt: updated.paidAt,
          updatedById: updated.updatedById,
        },
        transactions: [],
      }
    }

    const unitTransaction = await this.incrementUnitBalance.execute(
      loan.unitId,
      loan.userId,
      loan.amount.multiply(-1).toNumber(),
      { reason: TransactionReason.PAY_LOAN },
      undefined,
      true,
      loan.id,
      undefined,
    )

    return {
      loan: {
        id: updated.id,
        unitId: updated.unitId,
        userId: updated.userId,
        sessionId: updated.sessionId,
        amount: updated.amount,
        status: updated.status,
        createdAt: updated.createdAt,
        paidAt: updated.paidAt,
        updatedById: updated.updatedById,
      },
      transactions: [unitTransaction.transaction],
    }
  }
}
