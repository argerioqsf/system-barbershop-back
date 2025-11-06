import {
  CashRegisterRepositoryPort,
  CashSessionRecord,
} from '@/modules/finance/application/ports/cash-register-repository'
import {
  TransactionRecord,
  TransactionsRepository,
} from '@/modules/finance/application/ports/transactions-repository'
import {
  GetOpenCashSessionDTO,
  GetOpenCashSessionOutput,
  OpenCashSessionPresenter,
} from '../dto/get-open-cash-session.dto'

export class GetOpenCashSessionUseCase {
  constructor(
    private readonly cashRegisterRepository: CashRegisterRepositoryPort,
    private readonly transactionsRepository: TransactionsRepository,
  ) {}

  async execute(
    command: GetOpenCashSessionDTO,
  ): Promise<GetOpenCashSessionOutput> {
    const session = await this.cashRegisterRepository.findOpenByUnit(
      command.unitId,
    )

    if (!session) {
      return { session: null }
    }

    const transactions = await this.transactionsRepository.findManyBySession(
      session.id,
    )

    return {
      session: presentOpenSession(session, transactions),
    }
  }
}

function presentOpenSession(
  record: CashSessionRecord,
  transactions: TransactionRecord[],
): OpenCashSessionPresenter {
  return {
    id: record.id,
    unitId: record.unitId,
    openedById: record.openedByUserId,
    openedAt: record.openedAt,
    closedAt: record.closedAt,
    initialAmount: record.openingAmount.toNumber(),
    finalAmount: record.finalAmount.toNumber(),
    transactions: transactions.map(presentTransaction),
    commissionCheckpoints: record.commissionCheckpoints?.map((checkpoint) => ({
      profileId: checkpoint.profileId,
      totalBalance: checkpoint.totalBalance.toNumber(),
    })),
  }
}

function presentTransaction(
  record: TransactionRecord,
): OpenCashSessionPresenter['transactions'][number] {
  return {
    id: record.id,
    amount: record.amount.abs().toNumber(),
    reason: record.reason,
    description: record.description ?? null,
    createdAt: record.createdAt,
    type: record.type,
    userId: record.userId,
    affectedUserId: record.affectedUserId ?? null,
    saleId: record.saleId ?? null,
    saleItemId: record.saleItemId ?? null,
    sessionId: record.sessionId ?? null,
    unitId: record.unitId ?? null,
    loanId: record.loanId ?? null,
    appointmentServiceId: record.appointmentServiceId ?? null,
    receiptUrl: record.receiptUrl ?? null,
    isLoan: record.isLoan,
  }
}
