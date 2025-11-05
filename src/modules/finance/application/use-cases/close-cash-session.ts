import { CashSession } from '@/modules/finance/domain/entities/cash-session'
import {
  CashRegisterRepositoryPort,
  CashSessionRecord,
} from '@/modules/finance/application/ports/cash-register-repository'
import { SaleRepository } from '@/repositories/sale-repository'
import { CashRegisterNotOpenedError } from '../errors/cash-register-not-opened-error'
import { CashRegisterHasPendingSalesError } from '@/services/@errors/cash-register/cash-register-has-pending-sales-error'
import { SaleStatus } from '@prisma/client'
import { TransactionRunner } from '@/core/application/ports/transaction-runner'
import {
  TransactionRunnerLike,
  normalizeTransactionRunner,
} from '@/core/application/utils/transaction-runner'
import { defaultTransactionRunner } from '@/infra/prisma/transaction-runner'
import {
  CloseCashSessionDTO,
  CloseCashSessionOutput,
  CloseCashSessionPresenter,
} from '../dto/close-cash-session.dto'

export class CloseCashSessionUseCase {
  private readonly transactionRunner: TransactionRunner

  constructor(
    private readonly cashRegisterRepository: CashRegisterRepositoryPort,
    private readonly saleRepository: SaleRepository,
    transactionRunner?: TransactionRunnerLike,
  ) {
    this.transactionRunner = normalizeTransactionRunner(
      transactionRunner,
      defaultTransactionRunner,
    )
  }

  async execute(command: CloseCashSessionDTO): Promise<CloseCashSessionOutput> {
    const openSession = await this.cashRegisterRepository.findOpenByUnit(
      command.unitId,
    )

    if (!openSession) {
      throw new CashRegisterNotOpenedError()
    }

    const now = new Date()
    const pendingSales = await this.saleRepository.findMany({
      unitId: command.unitId,
      status: { notIn: [SaleStatus.COMPLETED, SaleStatus.CANCELLED] },
      createdAt: { gte: openSession.openedAt, lte: now },
    })

    if (pendingSales.length > 0) {
      throw new CashRegisterHasPendingSalesError()
    }

    const domainSession = CashSession.open({
      id: openSession.id,
      unitId: openSession.unitId,
      openedByUserId: openSession.openedByUserId,
      openedAt: openSession.openedAt,
      openingAmount: openSession.openingAmount,
      finalAmount: openSession.finalAmount,
      closedAt: openSession.closedAt,
    }).close(openSession.finalAmount, now)

    const closedSession = await this.transactionRunner.run(async (tx) => {
      return this.cashRegisterRepository.close(
        openSession.id,
        domainSession.finalAmount,
        domainSession.closedAt ?? now,
        tx,
      )
    })

    return {
      session: presentCashSession(closedSession),
    }
  }
}

function presentCashSession(
  record: CashSessionRecord,
): CloseCashSessionPresenter {
  return {
    id: record.id,
    unitId: record.unitId,
    openedById: record.openedByUserId,
    openedAt: record.openedAt,
    closedAt: record.closedAt,
    initialAmount: record.openingAmount.toNumber(),
    finalAmount: record.finalAmount.toNumber(),
    commissionCheckpoints: record.commissionCheckpoints?.map((checkpoint) => ({
      profileId: checkpoint.profileId,
      totalBalance: checkpoint.totalBalance.toNumber(),
    })),
  }
}
