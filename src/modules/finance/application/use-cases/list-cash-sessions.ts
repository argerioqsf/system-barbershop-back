import { UserToken } from '@/http/controllers/authenticate-controller'
import { assertUser } from '@/utils/assert-user'
import {
  CashRegisterRepositoryPort,
  CashSessionFilters,
  CashSessionRecord,
} from '@/modules/finance/application/ports/cash-register-repository'
import {
  TransactionsRepository,
  TransactionRecord,
} from '@/modules/finance/application/ports/transactions-repository'
import { SaleRepository, DetailedSale } from '@/repositories/sale-repository'
import {
  ListCashSessionsDTO,
  ListCashSessionsOutput,
  CashSessionPayload,
} from '../dto/list-cash-sessions.dto'

export class ListCashSessionsUseCase {
  constructor(
    private readonly cashRegisterRepository: CashRegisterRepositoryPort,
    private readonly transactionsRepository: TransactionsRepository,
    private readonly saleRepository: SaleRepository,
  ) {}

  async execute(command: ListCashSessionsDTO): Promise<ListCashSessionsOutput> {
    assertUser(command.actor)

    const filters = this.resolveFilters(command.actor)
    const sessions = await this.cashRegisterRepository.findMany(filters)

    const sessionsWithDetails = await Promise.all(
      sessions.map(async (session) => {
        const [transactions, sales] = await Promise.all([
          this.transactionsRepository.findManyBySession(session.id),
          this.saleRepository.findManyBySession(session.id),
        ])

        return toPayload(session, transactions, sales)
      }),
    )

    return {
      sessions: sessionsWithDetails,
    }
  }

  private resolveFilters(actor: UserToken): CashSessionFilters {
    if (actor.role === 'OWNER') {
      return { organizationId: actor.organizationId }
    }

    return { unitId: actor.unitId }
  }
}

function toPayload(
  session: CashSessionRecord,
  transactions: TransactionRecord[],
  sales: DetailedSale[],
): CashSessionPayload {
  return {
    id: session.id,
    unitId: session.unitId,
    openedById: session.openedByUserId,
    openedAt: session.openedAt,
    closedAt: session.closedAt,
    initialAmount: session.openingAmount.toNumber(),
    finalAmount: session.finalAmount.toNumber(),
    user: session.user,
    unit: session.unit,
    commissionCheckpoints: session.commissionCheckpoints?.map((checkpoint) => ({
      profileId: checkpoint.profileId,
      totalBalance: checkpoint.totalBalance.toNumber(),
    })),
    transactions: transactions.map(presentTransaction),
    sales,
  }
}

function presentTransaction(record: TransactionRecord) {
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
