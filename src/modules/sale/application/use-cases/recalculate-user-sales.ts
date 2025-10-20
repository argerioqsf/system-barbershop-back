import { PaymentStatus, Prisma } from '@prisma/client'
import { SaleRepository } from '@/repositories/sale-repository'
import { SaleItemRepository } from '@/repositories/sale-item-repository'
import { calculateTotal } from '@/services/sale/utils/sale'
import {
  updateDiscountsOnSaleItem,
  ReturnBuildItemData,
} from '@/services/sale/utils/item'
import { SaleItemsBuildService } from '@/modules/sale/application/services/sale-items-build-service'
import { TransactionRunner } from '@/core/application/ports/transaction-runner'
import {
  TransactionRunnerLike,
  normalizeTransactionRunner,
} from '@/core/application/utils/transaction-runner'
import { defaultTransactionRunner } from '@/infra/prisma/transaction-runner'

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
    tx?: Prisma.TransactionClient,
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
        for (const item of rebuilt) {
          if (item.id) {
            await updateDiscountsOnSaleItem(
              item,
              item.id,
              this.saleItemRepository,
              trx,
            )
          }
        }
        if (total !== sale.total) {
          await this.saleRepository.update(sale.id, { total }, trx)
        }
      }

      if (tx) {
        await run(tx)
      } else {
        await this.transactionRunner.run(async (trx) => {
          await run(trx)
        })
      }
    }
  }
}
