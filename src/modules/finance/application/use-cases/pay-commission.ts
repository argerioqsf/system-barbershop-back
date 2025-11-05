import { Money } from '@/core/domain/value-objects/money'
import { Percentage } from '@/core/domain/value-objects/percentage'
import { Transaction } from '@prisma/client'
import { TransactionReason } from '@/modules/finance/domain/entities/transaction'
import {
  CommissionCalculator,
  CommissionCalculationItem,
  CommissionCalculationResult,
  CommissionSourceInput,
} from '@/modules/finance/domain/services/commission-calculator'
import {
  SaleItemRepository,
  ReturnFindManyPendingCommission,
  DetailedAppointmentService,
} from '@/repositories/sale-item-repository'
import { AppointmentServiceRepository } from '@/repositories/appointment-service-repository'
import { IncrementBalanceProfileService } from '@/services/profile/increment-balance'
import { calculateRealValueSaleItem } from '@/services/sale/utils/item'
import { InvalidPayCommissionInputError } from '../errors/invalid-pay-commission-input-error'
import { NegativeValuesNotAllowedError } from '../errors/negative-values-not-allowed-error'
import { MissingCommissionMetaError } from '../errors/missing-commission-meta-error'
import {
  CommissionPreviewFilters,
  CommissionPreviewResult,
  PayCommissionDTO,
  PayCommissionOutput,
} from '../dto/pay-commission.dto'

type CommissionMeta = {
  saleId: string
  saleItemId: string
  appointmentServiceId?: string
  saleItem: ReturnFindManyPendingCommission
  appointmentService?: DetailedAppointmentService
}

export class PayCommissionUseCase {
  constructor(
    private readonly saleItemRepository: SaleItemRepository,
    private readonly appointmentServiceRepository: AppointmentServiceRepository,
    private readonly incrementBalanceProfileService: IncrementBalanceProfileService,
    private readonly commissionCalculator: CommissionCalculator,
  ) {}

  async preview(
    affectedUserId: string,
    filters: CommissionPreviewFilters = {},
  ): Promise<CommissionPreviewResult> {
    const calculation = await this.computePendingCommissions(
      affectedUserId,
      filters,
    )

    return {
      total: calculation.totalCommission,
      items: calculation.items,
    }
  }

  async execute(command: PayCommissionDTO): Promise<PayCommissionOutput> {
    const reason = command.reason ?? TransactionReason.PAY_COMMISSION

    const isAmountMode = !!command.amount
    const hasItemSelection =
      (command.saleItemIds?.length ?? 0) > 0 ||
      (command.appointmentServiceIds?.length ?? 0) > 0

    if (!isAmountMode && !hasItemSelection) {
      throw new InvalidPayCommissionInputError()
    }

    const calculation = await this.computePendingCommissions(
      command.affectedUserId,
      {
        saleItemIds: command.saleItemIds,
        appointmentServiceIds: command.appointmentServiceIds,
      },
    )

    const transactions: Transaction[] = []
    let totalPaid = Money.zero()

    if (isAmountMode) {
      const amount = command.amount ?? Money.zero()
      if (amount.isNegative()) {
        throw new NegativeValuesNotAllowedError()
      }

      if (amount.isZero()) {
        return { transactions: [], totalPaid }
      }

      let remaining = amount

      for (const item of calculation.items) {
        if (!item.meta) {
          continue
        }

        if (remaining.isZero() || remaining.isNegative()) {
          break
        }

        const amountToPay = remaining.lessThan(item.amount)
          ? remaining
          : item.amount

        if (amountToPay.isZero() || amountToPay.isNegative()) {
          continue
        }

        const transaction = await this.issueCommissionPayment(
          item,
          amountToPay,
          command,
          reason,
        )

        transactions.push(transaction)
        totalPaid = totalPaid.add(amountToPay)
        remaining = remaining.subtract(amountToPay).clampZero()
      }
    } else {
      const saleItemFilter = new Set(command.saleItemIds ?? [])
      const appointmentFilter = new Set(command.appointmentServiceIds ?? [])

      for (const item of calculation.items) {
        if (!item.meta) {
          continue
        }

        if (
          !this.matchesSelection(item.meta, saleItemFilter, appointmentFilter)
        ) {
          continue
        }

        if (!item.amount.isPositive()) {
          continue
        }

        const transaction = await this.issueCommissionPayment(
          item,
          item.amount,
          command,
          reason,
        )

        transactions.push(transaction)
        totalPaid = totalPaid.add(item.amount)
      }
    }

    return {
      transactions,
      totalPaid,
    }
  }

  private async computePendingCommissions(
    affectedUserId: string,
    filters: CommissionPreviewFilters,
  ): Promise<CommissionCalculationResult<CommissionMeta>> {
    const saleItems =
      filters.saleItemIds || filters.appointmentServiceIds
        ? await this.saleItemRepository.findManyPendingCommissionForIds(
            affectedUserId,
            filters.appointmentServiceIds,
            filters.saleItemIds,
          )
        : await this.saleItemRepository.findManyPendingCommission(
            affectedUserId,
          )

    const sources: CommissionSourceInput<CommissionMeta>[] = []

    for (const saleItem of saleItems) {
      if (saleItem.appointment && saleItem.appointment.services.length > 0) {
        for (const appointmentService of saleItem.appointment.services) {
          const percentageValue =
            appointmentService.commissionPercentage ??
            saleItem.porcentagemBarbeiro ??
            0

          const percentage = Percentage.from(percentageValue)
          const baseAmount = Money.from(appointmentService.service.price ?? 0)
          const alreadyPaid = this.sumTransactions(
            appointmentService.transactions,
          )

          sources.push({
            saleId: saleItem.sale.id,
            saleItemId: saleItem.id,
            appointmentServiceId: appointmentService.id,
            baseAmount,
            commissionPercentage: percentage,
            alreadyPaid,
            meta: {
              saleId: saleItem.sale.id,
              saleItemId: saleItem.id,
              appointmentServiceId: appointmentService.id,
              saleItem,
              appointmentService,
            },
          })
        }
      } else {
        const percentage = Percentage.from(saleItem.porcentagemBarbeiro ?? 0)
        const realPrice =
          calculateRealValueSaleItem(saleItem.price, saleItem.discounts) ?? 0
        const baseAmount = Money.from(realPrice)
        const alreadyPaid = this.sumTransactions(saleItem.transactions)

        sources.push({
          saleId: saleItem.sale.id,
          saleItemId: saleItem.id,
          baseAmount,
          commissionPercentage: percentage,
          alreadyPaid,
          meta: {
            saleId: saleItem.sale.id,
            saleItemId: saleItem.id,
            saleItem,
          },
        })
      }
    }

    return this.commissionCalculator.calculate(sources)
  }

  private matchesSelection(
    meta: CommissionMeta,
    saleItemFilter: Set<string>,
    appointmentFilter: Set<string>,
  ): boolean {
    const hasSaleFilter = saleItemFilter.size > 0
    const hasAppointmentFilter = appointmentFilter.size > 0

    if (meta.appointmentServiceId) {
      if (hasAppointmentFilter) {
        return appointmentFilter.has(meta.appointmentServiceId)
      }

      if (hasSaleFilter) {
        return saleItemFilter.has(meta.saleItemId)
      }

      return true
    }

    if (hasSaleFilter) {
      return saleItemFilter.has(meta.saleItemId)
    }

    return true
  }

  private async issueCommissionPayment(
    item: CommissionCalculationItem<CommissionMeta>,
    amountToPay: Money,
    command: PayCommissionDTO,
    reason: TransactionReason,
  ): Promise<Transaction> {
    const meta = item.meta
    if (!meta) {
      throw new MissingCommissionMetaError()
    }
    const tx = command.tx

    const payment = await this.incrementBalanceProfileService.execute(
      command.affectedUserId,
      amountToPay.negate().toNumber(),
      { reason, tx, userId: command.actorId },
      meta.saleId,
      undefined,
      command.description,
      meta.appointmentServiceId ? undefined : meta.saleItemId,
      meta.appointmentServiceId,
      undefined,
    )

    if (amountToPay.equals(item.amount)) {
      if (meta.appointmentServiceId) {
        await this.appointmentServiceRepository.update(
          meta.appointmentServiceId,
          { commissionPaid: true },
          tx,
        )
      } else {
        await this.saleItemRepository.update(
          meta.saleItemId,
          { commissionPaid: true },
          tx,
        )
      }
    }

    return payment.transaction
  }

  private sumTransactions(transactions: { amount: number }[] = []): Money {
    return transactions.reduce(
      (total, tx) => total.add(Money.from(tx.amount)),
      Money.zero(),
    )
  }
}
