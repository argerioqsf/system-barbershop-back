import { CannotEditPaidSaleItemError } from '@/services/@errors/sale/cannot-edit-paid-sale-item-error'
import { SaleTotalsService } from '@/modules/sale/application/services/sale-totals-service'
import {
  CreateSaleItem,
  SaleItemUpdateFields,
} from '@/modules/sale/application/dto/sale'
import {
  SaleItemRepository,
  DetailedSaleItemFindById,
} from '@/modules/sale/application/ports/sale-item-repository'
import {
  SaleRepository,
  DetailedSale,
} from '@/modules/sale/application/ports/sale-repository'
import { PaymentStatus, Prisma, SaleItem, SaleStatus } from '@prisma/client'
import { TransactionRunner } from '@/core/application/ports/transaction-runner'
import {
  TransactionRunnerLike,
  normalizeTransactionRunner,
} from '@/core/application/utils/transaction-runner'
import { defaultTransactionRunner } from '@/infra/prisma/transaction-runner'
import { mapSaleItemToPrismaUpdate } from '@/modules/sale/infra/mappers/sale-item-mapper'

export interface SaleItemUpdateExecutorDeps {
  saleItemRepository: SaleItemRepository
  saleRepository: SaleRepository
  saleTotalsService: SaleTotalsService
  transactionRunner?: TransactionRunnerLike
  runInTransaction?: TransactionRunnerLike
}

export interface SaleItemUpdateHookContext {
  saleItemCurrent: NonNullable<DetailedSaleItemFindById>
  saleItemUpdated: CreateSaleItem
  patch: SaleItemUpdateFields
  metadata: Record<string, unknown>
}

export interface SaleItemUpdateRebuildContext
  extends SaleItemUpdateHookContext {
  rebuild: Awaited<
    ReturnType<SaleTotalsService['recalculateSaleTotalsOnItemChange']>
  >
}

export interface SaleItemUpdateTransactionContext
  extends SaleItemUpdateRebuildContext {
  tx: Prisma.TransactionClient
}

export interface SaleItemUpdateHooks {
  beforeRebuild?: (
    context: SaleItemUpdateHookContext,
  ) => Promise<Record<string, unknown> | void> | Record<string, unknown> | void
  afterTransaction?: (
    context: SaleItemUpdateTransactionContext,
  ) => Promise<void> | void
}

export interface SaleItemUpdateExecutorInput {
  saleItemId: string
  patch: SaleItemUpdateFields
  hooks?: SaleItemUpdateHooks
}

export interface SaleItemUpdateExecutorResult {
  sale?: DetailedSale
  saleItems?: SaleItem[]
}

export class SaleItemUpdateExecutor {
  private readonly transactionRunner: TransactionRunner

  constructor(private readonly deps: SaleItemUpdateExecutorDeps) {
    const runner = deps.transactionRunner ?? deps.runInTransaction ?? undefined

    this.transactionRunner = normalizeTransactionRunner(
      runner,
      defaultTransactionRunner,
    )
  }

  async execute({
    saleItemId,
    patch,
    hooks,
  }: SaleItemUpdateExecutorInput): Promise<SaleItemUpdateExecutorResult> {
    const { saleItemRepository, saleTotalsService, saleRepository } = this.deps

    const saleItemCurrent = await saleItemRepository.findById(saleItemId)
    if (!saleItemCurrent) throw new Error('Sale Item not found')
    this.ensureSaleItemIsEditable(saleItemCurrent)

    const saleItemUpdated = this.mergeSaleItemUpdate(patch, saleItemCurrent)
    const hookContext: SaleItemUpdateHookContext = {
      saleItemCurrent,
      saleItemUpdated,
      patch,
      metadata: {},
    }

    if (hooks?.beforeRebuild) {
      const extra = await hooks.beforeRebuild(hookContext)
      if (extra) {
        hookContext.metadata = { ...hookContext.metadata, ...extra }
      }
    }

    const rebuild = await saleTotalsService.recalculateSaleTotalsOnItemChange({
      currentItem: saleItemCurrent,
      updatedItem: saleItemUpdated,
    })

    const saleItemUpdates = rebuild.itemsForUpdate
      .filter((saleItem) => saleItem.id)
      .map((saleItem) => ({
        id: saleItem.id as string,
        data: mapSaleItemToPrismaUpdate(saleItem),
      }))

    let saleUpdate: DetailedSale | undefined
    let saleItemsUpdate: SaleItem[] | undefined

    await this.transactionRunner.run(async (tx) => {
      saleItemsUpdate = await saleItemRepository.updateManyIndividually(
        saleItemUpdates,
        tx,
      )

      if (rebuild.totalSale >= 0) {
        saleUpdate = await saleRepository.update(
          saleItemCurrent.saleId,
          {
            total: rebuild.totalSale,
            gross_value: rebuild.grossTotalSale,
          },
          tx,
        )
      }

      if (hooks?.afterTransaction) {
        await hooks.afterTransaction({
          ...hookContext,
          rebuild,
          tx,
        })
      }
    })

    return { sale: saleUpdate, saleItems: saleItemsUpdate }
  }

  private ensureSaleItemIsEditable(
    saleItem: NonNullable<DetailedSaleItemFindById>,
  ) {
    if (saleItem.commissionPaid === true) {
      throw new CannotEditPaidSaleItemError()
    }

    if (
      saleItem.sale.paymentStatus === PaymentStatus.PAID ||
      saleItem.sale.status === SaleStatus.COMPLETED ||
      saleItem.sale.status === SaleStatus.CANCELLED
    ) {
      throw new Error('Cannot edit a paid, completed, or cancelled sale.')
    }
  }

  private mergeSaleItemUpdate(
    patch: SaleItemUpdateFields,
    current: NonNullable<DetailedSaleItemFindById>,
  ): CreateSaleItem {
    const quantity =
      patch.quantity !== undefined ? patch.quantity : current.quantity
    const appointmentId =
      patch.appointmentId !== undefined
        ? patch.appointmentId
        : current.appointmentId
    const barberId =
      patch.barberId !== undefined ? patch.barberId : current.barberId
    const couponId =
      patch.couponId !== undefined ? patch.couponId : current.couponId
    const customPrice =
      patch.customPrice !== undefined ? patch.customPrice : current.customPrice
    const planId = patch.planId !== undefined ? patch.planId : current.planId
    const productId =
      patch.productId !== undefined ? patch.productId : current.productId
    const serviceId =
      patch.serviceId !== undefined ? patch.serviceId : current.serviceId

    return {
      id: current.id,
      price: current.price,
      quantity,
      appointmentId,
      barberId,
      couponId,
      customPrice,
      planId,
      productId,
      serviceId,
    }
  }
}
