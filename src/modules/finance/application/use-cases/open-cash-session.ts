import { Money } from '@/core/domain/value-objects/money'
import { TransactionRunner } from '@/core/application/ports/transaction-runner'
import {
  TransactionRunnerLike,
  normalizeTransactionRunner,
} from '@/core/application/utils/transaction-runner'
import { defaultTransactionRunner } from '@/infra/prisma/transaction-runner'
import { CashSession } from '@/modules/finance/domain/entities/cash-session'
import { CashRegisterRepositoryPort } from '@/modules/finance/application/ports/cash-register-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { IncrementBalanceUnitService } from '@/services/unit/increment-balance'
import { UserNotFoundError } from '@/core/application/errors/user-not-found-error'
import { CashRegisterAlreadyOpenError } from '../errors/cash-register-already-open-error'
import { InvalidCashSessionError } from '../../domain/errors/invalid-cash-session-error'
import { TransactionReason } from '../../domain/entities/transaction'
import {
  OpenCashSessionDTO,
  OpenCashSessionOutput,
} from '../dto/open-cash-session.dto'

export class OpenCashSessionUseCase {
  private readonly transactionRunner: TransactionRunner

  constructor(
    private readonly cashRegisterRepository: CashRegisterRepositoryPort,
    private readonly profilesRepository: ProfilesRepository,
    private readonly incrementBalanceUnitService: IncrementBalanceUnitService,
    transactionRunner?: TransactionRunnerLike,
  ) {
    this.transactionRunner = normalizeTransactionRunner(
      transactionRunner,
      defaultTransactionRunner,
    )
  }

  async execute(command: OpenCashSessionDTO): Promise<OpenCashSessionOutput> {
    if (!command.actorId) {
      throw new UserNotFoundError()
    }

    const initialAmount = command.initialAmount

    if (initialAmount.isNegative()) {
      throw InvalidCashSessionError.amountCannotBeNegative('Initial')
    }

    const existing = await this.cashRegisterRepository.findOpenByUnit(
      command.unitId,
    )

    if (existing) {
      throw new CashRegisterAlreadyOpenError()
    }

    const profiles = await this.profilesRepository.findMany({
      user: { unitId: command.unitId },
    })

    const commissionCheckpoints = profiles.map((profile) => ({
      profileId: profile.id,
      totalBalance: Money.from(profile.totalBalance ?? 0),
    }))

    const domainSession = CashSession.open({
      unitId: command.unitId,
      openedByUserId: command.actorId,
      openingAmount: initialAmount,
    })

    const created = await this.transactionRunner.run(async (tx) => {
      const record = await this.cashRegisterRepository.create(
        {
          unitId: domainSession.unitId,
          openedByUserId: domainSession.openedByUserId,
          openedAt: domainSession.openedAt,
          openingAmount: domainSession.openingAmount,
          finalAmount: domainSession.finalAmount,
          commissionCheckpoints,
        },
        tx,
      )

      if (initialAmount.isPositive()) {
        await this.incrementBalanceUnitService.execute(
          command.unitId,
          command.actorId,
          initialAmount.toNumber(),
          { reason: TransactionReason.CASH_OPENING, tx },
          undefined,
          false,
          undefined,
          'Initial amount',
        )
      }

      return record
    })

    return {
      session: {
        id: created.id,
        unitId: created.unitId,
        openedByUserId: created.openedByUserId,
        openedAt: created.openedAt,
        closedAt: created.closedAt,
        initialAmount: created.openingAmount.toNumber(),
        finalAmount: created.finalAmount.toNumber(),
        commissionCheckpoints: created.commissionCheckpoints?.map(
          (checkpoint) => ({
            profileId: checkpoint.profileId,
            totalBalance: checkpoint.totalBalance.toNumber(),
          }),
        ),
      },
    }
  }
}
