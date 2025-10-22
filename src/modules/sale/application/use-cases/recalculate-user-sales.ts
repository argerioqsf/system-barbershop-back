import { PaymentStatus, Prisma } from '@prisma/client'
import { SaleRepository } from '@/modules/sale/application/ports/sale-repository'
import { SaleItemRepository } from '@/modules/sale/application/ports/sale-item-repository'
import { calculateTotal } from '@/modules/sale/application/services/sale-totals-calculator'
import { ReturnBuildItemData } from '@/modules/sale/application/dto/sale-item-dto'
import { DiscountSyncService } from '@/modules/sale/application/services/discount-sync-service'
import { SaleItemsBuildService } from '@/modules/sale/application/services/sale-items-build-service'
import { TransactionRunner } from '@/core/application/ports/transaction-runner'
import {
  TransactionRunnerLike,
  normalizeTransactionRunner,
} from '@/core/application/utils/transaction-runner'
import { defaultTransactionRunner } from '@/infra/prisma/transaction-runner'
import { UseCaseCtx } from '@/core/application/use-case-ctx'

interface RecalculateUserSalesRequest {
  userIds: string[]
}

export class RecalculateUserSalesService {
  private readonly transactionRunner: TransactionRunner

  constructor(
    private readonly saleRepository: SaleRepository,
    private readonly saleItemRepository: SaleItemRepository,
    private readonly saleItemsBuildService: SaleItemsBuildService,
    transactionRunner?: TransactionRunnerLike,
  ) {
    this.transactionRunner = normalizeTransactionRunner(
      transactionRunner,
      defaultTransactionRunner,
    )
  }

  async execute(
    { userIds }: RecalculateUserSalesRequest,
    ctx?: UseCaseCtx,
  ): Promise<void> {
    if (userIds.length === 0) return
    const sales = await this.saleRepository.findMany({
      clientId: { in: userIds },
      paymentStatus: { not: PaymentStatus.PAID },
    })

    for (const sale of sales) {
      const { saleItemsBuild } = await this.saleItemsBuildService.buildFromSale(
        sale,
        sale.unitId,
      )

      const rebuilt: ReturnBuildItemData[] =
        await this.saleItemsBuildService.applyCouponIfNeeded(
          sale,
          saleItemsBuild,
        )

      const total = calculateTotal(rebuilt)

      const run = async (trx: Prisma.TransactionClient) => {
        const discountSync = new DiscountSyncService(this.saleItemRepository)
        for (const item of rebuilt) {
          if (item.id) {
            await discountSync.sync(item, item.id, trx)
          }
        }
        if (total !== sale.total) {
          await this.saleRepository.update(sale.id, { total }, trx)
        }
      }

      if (ctx?.tx) {
        await run(ctx.tx)
      } else {
        await this.transactionRunner.run(async (trx) => {
          await run(trx)
        })
      }
    }
  }
}
