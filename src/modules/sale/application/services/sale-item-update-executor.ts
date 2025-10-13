import { prisma } from '@/lib/prisma'
import { CannotEditPaidSaleItemError } from '@/services/@errors/sale/cannot-edit-paid-sale-item-error'
import { SaleTotalsService } from '@/modules/sale/application/services/sale-totals-service'
import { CreateSaleItem, SaleItemUpdateFields } from '@/services/sale/types'
import { mountSaleItemUpdate } from '@/services/sale/utils/item'
import { mapToSaleItemsForUpdate } from '@/services/sale/utils/sale'
import {
  SaleItemRepository,
  DetailedSaleItemFindById,
} from '@/repositories/sale-item-repository'
import { SaleRepository, DetailedSale } from '@/repositories/sale-repository'
import { PaymentStatus, Prisma, SaleItem, SaleStatus } from '@prisma/client'

export type TransactionRunner = <T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
) => Promise<T>

export interface SaleItemUpdateExecutorDeps {
  saleItemRepository: SaleItemRepository
  saleRepository: SaleRepository
  saleTotalsService: SaleTotalsService
  runInTransaction?: TransactionRunner
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
  private readonly runInTransaction: TransactionRunner

  constructor(private readonly deps: SaleItemUpdateExecutorDeps) {
    this.runInTransaction =
      deps.runInTransaction ?? ((fn) => prisma.$transaction(fn))
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

    const saleItemUpdated = mountSaleItemUpdate(patch, saleItemCurrent)
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

    const saleItemUpdates = mapToSaleItemsForUpdate(rebuild.itemsForUpdate)
      .filter((saleItem) => saleItem.id)
      .map((saleItem) => ({
        id: saleItem.id as string,
        data: saleItem,
      }))

    let saleUpdate: DetailedSale | undefined
    let saleItemsUpdate: SaleItem[] | undefined

    await this.runInTransaction(async (tx) => {
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
}
