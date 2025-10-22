import {
  SaleRepository,
  DetailedSale,
} from '@/modules/sale/application/ports/sale-repository'
import {
  ProfilesRepository,
  ResponseFindByUserId,
} from '@/modules/sale/application/ports/profiles-repository'
import { SaleItemRepository } from '@/modules/sale/application/ports/sale-item-repository'
import { PlanRepository } from '@/modules/sale/application/ports/plan-repository'
import { PlanProfileRepository } from '@/modules/sale/application/ports/plan-profile-repository'
import { ReturnBuildItemData } from '@/modules/sale/application/dto/sale-item-dto'
import { ProfileNotFoundError } from '@/services/@errors/profile/profile-not-found-error'
import {
  PaymentStatus,
  Prisma,
  DiscountOrigin,
  SaleStatus,
} from '@prisma/client'
import { TransactionRunner } from '@/core/application/ports/transaction-runner'
import {
  TransactionRunnerLike,
  normalizeTransactionRunner,
} from '@/core/application/utils/transaction-runner'
import { defaultTransactionRunner } from '@/infra/prisma/transaction-runner'
import { UpdateSaleRequest } from '@/modules/sale/application/dto/sale'
import { SaleTelemetry } from '@/modules/sale/application/ports/sale-telemetry'
import { UseCaseCtx } from '@/core/application/use-case-ctx'
import { SaleItemsBuildService } from '@/modules/sale/application/services/sale-items-build-service'
import { PlanDiscountService } from '@/modules/sale/application/services/plan-discount-service'
import { calculateTotal } from '@/modules/sale/application/services/sale-totals-calculator'
import { DiscountSyncService } from '@/modules/sale/application/services/discount-sync-service'

export interface UpdateSaleClientOutput {
  sale?: DetailedSale
}

export class UpdateSaleClientUseCase {
  private readonly transactionRunner: TransactionRunner

  constructor(
    private readonly saleRepository: SaleRepository,
    private readonly profileRepository: ProfilesRepository,
    private readonly saleItemRepository: SaleItemRepository,
    private readonly planRepository: PlanRepository,
    private readonly planProfileRepository: PlanProfileRepository,
    private readonly saleItemsBuildService: SaleItemsBuildService,
    transactionRunner?: TransactionRunnerLike,
    private readonly telemetry?: SaleTelemetry,
  ) {
    this.transactionRunner = normalizeTransactionRunner(
      transactionRunner,
      defaultTransactionRunner,
    )
    this.planDiscountService = new PlanDiscountService({
      planRepository: this.planRepository,
      planProfileRepository: this.planProfileRepository,
    })
  }

  private readonly planDiscountService: PlanDiscountService

  async execute(
    input: UpdateSaleRequest,
    ctx?: UseCaseCtx,
  ): Promise<UpdateSaleClientOutput> {
    const { id, clientId } = input

    if (!id) throw new Error('Sale ID is required')

    const saleCurrent = await this.saleRepository.findById(id)
    if (!saleCurrent) throw new Error('Sale not found')
    if (
      saleCurrent.paymentStatus === PaymentStatus.PAID ||
      saleCurrent.status === SaleStatus.COMPLETED ||
      saleCurrent.status === SaleStatus.CANCELLED
    ) {
      throw new Error('Cannot edit a paid, completed, or cancelled sale.')
    }

    if (!clientId || clientId === saleCurrent.clientId) {
      throw new Error('No changes to the client')
    }

    const newClientProfile: ResponseFindByUserId | null =
      await this.profileRepository.findByUserId(clientId)
    if (!newClientProfile) throw new ProfileNotFoundError()

    const { saleItemsBuild } = await this.saleItemsBuildService.buildFromSale(
      saleCurrent,
      saleCurrent.unitId,
    )

    for (const item of saleItemsBuild) {
      item.price = item.basePrice
      item.discounts = item.discounts.filter(
        (discount) => discount.origin !== DiscountOrigin.PLAN,
      )
    }

    const saleItemsWithDiscountPlan = await this.planDiscountService.apply(
      saleItemsBuild,
      newClientProfile.userId,
      saleCurrent.unitId,
    )

    const totalCurrentSaleItems = calculateTotal(saleItemsWithDiscountPlan)

    const runner: TransactionRunner = ctx?.tx
      ? {
          run: <T>(handler: (tx: Prisma.TransactionClient) => Promise<T>) => {
            const tx = ctx.tx
            if (!tx) {
              throw new Error(
                'Transaction context is missing transaction client',
              )
            }
            return handler(tx)
          },
        }
      : this.transactionRunner

    const saleUpdate = await runner.run(async (tx) => {
      await this.updateSaleItems(saleItemsWithDiscountPlan, tx)

      return this.saleRepository.update(
        id,
        {
          ...(totalCurrentSaleItems !== saleCurrent.total
            ? { total: totalCurrentSaleItems }
            : {}),
          client: {
            connect: { id: clientId },
          },
        },
        tx,
      )
    })

    this.telemetry?.record({
      operation: 'sale.client.updated',
      saleId: saleUpdate?.id ?? id,
      actorId: input.performedBy,
      metadata: {
        previousClientId: saleCurrent.clientId,
        newClientId: clientId,
      },
    })

    return { sale: saleUpdate }
  }

  private async updateSaleItems(
    saleItems: ReturnBuildItemData[],
    tx: Prisma.TransactionClient,
  ) {
    const discountSync = new DiscountSyncService(this.saleItemRepository)
    for (const saleItem of saleItems) {
      if (!saleItem.id) continue
      await discountSync.sync(saleItem, saleItem.id, tx)
    }
  }
}
