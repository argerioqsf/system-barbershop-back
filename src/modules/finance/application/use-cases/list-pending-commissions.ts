import { Money } from '@/core/domain/value-objects/money'
import { Percentage } from '@/core/domain/value-objects/percentage'
import {
  CommissionCalculator,
  CommissionSourceInput,
} from '@/modules/finance/domain/services/commission-calculator'
import {
  LoanRepository,
  LoanWithTransactions,
} from '@/repositories/loan-repository'
import {
  ReturnFindManyPendingCommission,
  SaleItemRepository,
} from '@/repositories/sale-item-repository'
import { calculateRealValueSaleItem } from '@/services/sale/utils/item'
import { Transaction as PrismaTransaction } from '@prisma/client'
import { LoanStatus } from '@/modules/finance/domain/types/status'
import { MissingCommissionMetaError } from '../errors/missing-commission-meta-error'
import {
  ListPendingCommissionsDTO,
  ListPendingCommissionsOutput,
  PaymentItem,
} from '../dto/list-pending-commissions.dto'

type PendingCommissionMeta = {
  saleId: string
  saleItemId: string
  appointmentServiceId?: string
  item: ReturnFindManyPendingCommission
  transactions: PrismaTransaction[]
  service?: ReturnFindManyPendingCommission['service']
  sale: ReturnFindManyPendingCommission['sale']
}

export class ListPendingCommissionsUseCase {
  constructor(
    private readonly saleItemRepository: SaleItemRepository,
    private readonly loanRepository: LoanRepository,
    private readonly commissionCalculator = new CommissionCalculator(),
  ) {}

  async execute(
    command: ListPendingCommissionsDTO,
  ): Promise<ListPendingCommissionsOutput> {
    const saleItems = await this.saleItemRepository.findManyPendingCommission(
      command.userId,
    )

    const loans = await this.loanRepository.findMany({
      userId: command.userId,
      status: LoanStatus.VALUE_TRANSFERRED,
    })

    const calculatorResult =
      this.commissionCalculator.calculate<PendingCommissionMeta>(
        this.buildCommissionSources(saleItems),
      )

    const saleItemsRecords: PaymentItem[] = calculatorResult.items.map(
      (item) => {
        const meta = item.meta
        if (!meta) {
          throw new MissingCommissionMetaError()
        }
        return {
          saleId: item.saleId,
          saleItemId: item.saleItemId,
          appointmentServiceId: item.appointmentServiceId,
          amount: item.amount.toNumber(),
          item: meta.item,
          service: meta.service ?? undefined,
          sale: meta.sale,
          transactions: meta.transactions ?? [],
        }
      },
    )

    const totalCommission = calculatorResult.totalCommission.toNumber()
    const outstanding = this.calculateOutstanding(loans).negate().toNumber()

    return {
      saleItemsRecords,
      totalCommission,
      outstanding,
      loans,
    }
  }

  private buildCommissionSources(
    saleItems: ReturnFindManyPendingCommission[],
  ): CommissionSourceInput<PendingCommissionMeta>[] {
    const sources = saleItems.flatMap((item) => {
      const baseSale = item.sale

      if (item.appointment?.services?.length) {
        return item.appointment.services.map((service) => {
          const commissionPercentage =
            service.commissionPercentage ?? item.porcentagemBarbeiro ?? 0

          return {
            saleId: baseSale.id,
            saleItemId: item.id,
            appointmentServiceId: service.id,
            baseAmount: Money.from(service.service.price ?? 0),
            commissionPercentage: Percentage.from(commissionPercentage),
            alreadyPaid: this.sumTransactions(service.transactions),
            meta: {
              saleId: baseSale.id,
              saleItemId: item.id,
              appointmentServiceId: service.id,
              item,
              transactions: service.transactions ?? [],
              service: service.service,
              sale: baseSale,
            } satisfies PendingCommissionMeta,
          }
        })
      }

      const commissionPercentage = item.porcentagemBarbeiro ?? 0
      const baseValue = calculateRealValueSaleItem(item.price, item.discounts)
      return [
        {
          saleId: baseSale.id,
          saleItemId: item.id,
          baseAmount: Money.from(baseValue ?? 0),
          commissionPercentage: Percentage.from(commissionPercentage),
          alreadyPaid: this.sumTransactions(item.transactions),
          meta: {
            saleId: baseSale.id,
            saleItemId: item.id,
            item,
            transactions: item.transactions ?? [],
            service: item.service,
            sale: baseSale,
          } satisfies PendingCommissionMeta,
        },
      ]
    })

    return sources
  }

  private sumTransactions(transactions: PrismaTransaction[] = []): Money {
    return transactions.reduce(
      (total, transaction) => total.add(Money.from(transaction.amount)),
      Money.zero(),
    )
  }

  private calculateOutstanding(loans: LoanWithTransactions[]): Money {
    return loans.reduce((sum, loan) => {
      const loanAmount = Money.from(loan.amount)
      const paid = loan.transactions.reduce((acc, transaction) => {
        if (transaction.amount <= 0) {
          return acc
        }

        return acc.add(Money.from(transaction.amount))
      }, Money.zero())

      const remaining = loanAmount.subtract(paid).clampZero()
      return sum.add(remaining)
    }, Money.zero())
  }
}
