import { SaleRepository, DetailedSale } from '@/repositories/sale-repository'
import {
  ProfilesRepository,
  ResponseFindByUserId,
} from '@/repositories/profiles-repository'
import { SaleItemRepository } from '@/repositories/sale-item-repository'
import { PlanRepository } from '@/repositories/plan-repository'
import { PlanProfileRepository } from '@/repositories/plan-profile-repository'
import { GetItemsBuildService } from '@/services/sale/get-items-build'
import {
  ReturnBuildItemData,
  updateDiscountsOnSaleItem,
} from '@/services/sale/utils/item'
import { applyPlanDiscounts } from '@/services/sale/utils/plan'
import { calculateTotal } from '@/services/sale/utils/sale'
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
import { UpdateSaleRequest } from '@/services/sale/types'
import { SaleTelemetry } from '@/modules/sale/application/contracts/sale-telemetry'

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
    private readonly getItemsBuildService: GetItemsBuildService,
    transactionRunner?: TransactionRunnerLike,
    private readonly telemetry?: SaleTelemetry,
  ) {
    this.transactionRunner = normalizeTransactionRunner(
      transactionRunner,
      defaultTransactionRunner,
    )
  }

  async execute(input: UpdateSaleRequest): Promise<UpdateSaleClientOutput> {
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

    const { saleItemsBuild } = await this.getItemsBuildService.execute({
      saleItems: saleCurrent.items,
      unitId: saleCurrent.unitId,
    })

    for (const item of saleItemsBuild) {
      item.price = item.basePrice
      item.discounts = item.discounts.filter(
        (discount) => discount.origin !== DiscountOrigin.PLAN,
      )
    }

    const saleItemsWithDiscountPlan = await applyPlanDiscounts(
      saleItemsBuild,
      newClientProfile.userId,
      this.planProfileRepository,
      this.planRepository,
      saleCurrent.unitId,
    )

    const totalCurrentSaleItems = calculateTotal(saleItemsWithDiscountPlan)

    const saleUpdate = await this.transactionRunner.run(async (tx) => {
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
    for (const saleItem of saleItems) {
      if (!saleItem.id) continue
      await updateDiscountsOnSaleItem(
        saleItem,
        saleItem.id,
        this.saleItemRepository,
        tx,
      )
    }
  }
}
