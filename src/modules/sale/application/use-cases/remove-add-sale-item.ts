import {
  SaleRepository,
  DetailedSale,
} from '@/modules/sale/application/ports/sale-repository'
import { ProductRepository } from '@/modules/sale/application/ports/product-repository'
import { AppointmentRepository } from '@/modules/sale/application/ports/appointment-repository'
import {
  BarberUsersRepository,
  UserFindById,
} from '@/modules/sale/application/ports/barber-users-repository'
import { SaleItemRepository } from '@/modules/sale/application/ports/sale-item-repository'
import {
  ProductToUpdate,
  ReturnBuildItemData,
  SaleItemBuildItem,
} from '@/modules/sale/application/dto/sale-item-dto'
import {
  calculateTotal,
  calculateGrossTotal,
} from '@/modules/sale/application/services/sale-totals-calculator'
import {
  mapSaleItemToPrismaCreate,
  mapDetailedSaleItemToBuild,
} from '@/modules/sale/infra/mappers/sale-item-mapper'
import { StockService } from '@/modules/sale/application/services/stock-service'
import {
  CreateSaleItem,
  RemoveAddSaleItemRequest,
} from '@/modules/sale/application/dto/sale'
import { PaymentStatus, Prisma, SaleStatus } from '@prisma/client'
import {
  BuildItemsResult,
  SaleItemsBuildService,
} from '../services/sale-items-build-service'
import { SaleTelemetry } from '@/modules/sale/application/ports/sale-telemetry'
import { logger } from '@/lib/logger'
import { AppointmentAlreadyLinkedError } from '@/services/@errors/appointment/appointment-already-linked-error'
import { TransactionRunner } from '@/core/application/ports/transaction-runner'
import {
  TransactionRunnerLike,
  normalizeTransactionRunner,
} from '@/core/application/utils/transaction-runner'
import { defaultTransactionRunner } from '@/infra/prisma/transaction-runner'
import { DiscountSyncService } from '@/modules/sale/application/services/discount-sync-service'
import { UseCaseCtx } from '@/core/application/use-case-ctx'

interface UpdateSaleResponse {
  sale?: DetailedSale
}

type ProductsToRestore = { id: string; quantity: number }

export class RemoveAddSaleItemUseCase {
  private readonly transactionRunner: TransactionRunner
  private readonly stockService: StockService

  constructor(
    private readonly saleRepository: SaleRepository,
    private readonly productRepository: ProductRepository,
    private readonly appointmentRepository: AppointmentRepository,
    private readonly barberUserRepository: BarberUsersRepository,
    private readonly saleItemRepository: SaleItemRepository,
    private readonly saleItemsBuildService: SaleItemsBuildService,
    transactionRunner?: TransactionRunnerLike,
    private readonly telemetry?: SaleTelemetry,
  ) {
    this.transactionRunner = normalizeTransactionRunner(
      transactionRunner,
      defaultTransactionRunner,
    )
    this.stockService = new StockService(productRepository)
  }

  private async getItemsBuild(
    saleItems: SaleItemBuildItem[],
    unitId: string,
  ): Promise<BuildItemsResult> {
    return this.saleItemsBuildService.buildSaleItemsForUnit(saleItems, unitId)
  }

  private async initVerify(
    id: string,
    removeItemIds?: string[],
    addItems?: CreateSaleItem[],
  ): Promise<{
    saleCurrent: NonNullable<DetailedSale>
    user: NonNullable<UserFindById>
    generalSaleItems: ReturnBuildItemData[]
  }> {
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

    const user = await this.barberUserRepository.findById(saleCurrent.userId)
    if (!user) throw new Error('User not found')
    logger.debug('addItems: ', { addItems })
    logger.debug('removeItemIds: ', { removeItemIds })
    const hasItemChanges =
      (addItems && addItems.length > 0) ||
      (removeItemIds && removeItemIds.length > 0)
    if (!hasItemChanges) throw new Error('No item changes detected')

    const { saleItemsBuild } = await this.saleItemsBuildService.buildFromSale(
      saleCurrent,
      user.unitId,
    )

    return {
      saleCurrent,
      user,
      generalSaleItems: saleItemsBuild,
    }
  }

  private async removeItemsFromSaleAndRebuild(
    removeItemIds: string[],
    saleCurrent: DetailedSale,
    productsToRestore: ProductsToRestore[],
    unitId: string,
  ): Promise<ReturnBuildItemData[]> {
    for (const idToRemove of removeItemIds) {
      const found = saleCurrent.items.find((i) => i.id === idToRemove)
      if (found?.productId) {
        productsToRestore.push({
          id: found.productId,
          quantity: found.quantity,
        })
      }
    }

    const saleCurrentRemovedItems = saleCurrent.items.filter(
      (item) => !removeItemIds.includes(item.id),
    )

    const saleItemsBuildPayload = saleCurrentRemovedItems.map((item) =>
      mapDetailedSaleItemToBuild(saleCurrent.id, item),
    )

    return (await this.getItemsBuild(saleItemsBuildPayload, unitId))
      .saleItemsBuild
  }

  private async removingRelationshipsFromRemovedSaleItems(
    removeItemIds: string[],
    tx: Prisma.TransactionClient,
  ) {
    for (const saleItemId of removeItemIds) {
      await tx.discount.deleteMany({ where: { saleItemId } })
      await tx.planProfile.deleteMany({ where: { saleItemId } })
    }
  }

  private async updateSaleItems(
    saleItems: ReturnBuildItemData[],
    tx: Prisma.TransactionClient,
  ) {
    const discountSync = new DiscountSyncService(this.saleItemRepository)
    for (const saleItem of saleItems) {
      if (saleItem.id) {
        await discountSync.sync(saleItem, saleItem.id, tx)
      }

      if (saleItem.appointment) {
        await this.appointmentRepository.update(
          saleItem.appointment.id,
          {
            saleItem: { connect: { id: saleItem.id } },
          },
          tx,
        )
      }
    }
  }

  private async updateSale(
    saleId: string,
    newTotal: number,
    newGrossTotal: number,
    currentTotal: number,
    newSaleItemsMapped: Prisma.SaleItemCreateWithoutSaleInput[],
    tx: Prisma.TransactionClient,
    removeSaleItemIds?: string[],
  ) {
    return this.saleRepository.update(
      saleId,
      {
        ...(newTotal !== currentTotal ? { total: newTotal } : {}),
        gross_value: newGrossTotal,
        items: {
          create: newSaleItemsMapped,
          deleteMany: removeSaleItemIds?.map((rid) => ({ id: rid })),
        },
      },
      tx,
    )
  }

  private checkIfHaveAppointmentItems(addItems: CreateSaleItem[]) {
    return addItems.some((item) => item.appointmentId)
  }

  private async checkIfAnyAppointmentAlreadyLinkedToASale(
    addItems: CreateSaleItem[],
  ) {
    let appointmentIsAlreadyLinked = false
    const itemsWithAppointments = addItems.filter((item) => item.appointmentId)
    for (const item of itemsWithAppointments) {
      const appointment = await this.appointmentRepository.findById(
        item.appointmentId as string,
      )
      if (appointment?.saleItem) {
        appointmentIsAlreadyLinked = true
        break
      }
    }
    if (appointmentIsAlreadyLinked) {
      throw new AppointmentAlreadyLinkedError()
    }
  }

  private async updateStockProducts(
    productsToRestore: ProductsToRestore[],
    productsToUpdate: ProductToUpdate[],
    tx: Prisma.TransactionClient,
  ) {
    if (productsToUpdate.length > 0) {
      await this.stockService.adjust(productsToUpdate, 'decrement', tx)
    }

    if (productsToRestore.length > 0) {
      await this.stockService.adjust(productsToRestore, 'increment', tx)
    }
  }

  async execute(
    { id, addItems, removeItemIds, performedBy }: RemoveAddSaleItemRequest,
    ctx?: UseCaseCtx,
  ): Promise<UpdateSaleResponse> {
    let saleUpdate: DetailedSale | undefined
    let newSaleItems: ReturnBuildItemData[] = []
    const productsToUpdate: ProductToUpdate[] = []
    const productsToRestore: ProductsToRestore[] = []

    let { saleCurrent, user, generalSaleItems } = await this.initVerify(
      id,
      removeItemIds,
      addItems,
    )

    if (removeItemIds?.length) {
      generalSaleItems = await this.removeItemsFromSaleAndRebuild(
        removeItemIds,
        saleCurrent,
        productsToRestore,
        user.unitId,
      )
    }

    if (addItems?.length) {
      const addItemsFormatted: SaleItemBuildItem[] = addItems.map((item) => ({
        saleId: id,
        id: item.id,
        serviceId: item.serviceId ?? undefined,
        productId: item.productId ?? undefined,
        appointmentId: item.appointmentId ?? undefined,
        planId: item.planId ?? undefined,
        barberId: item.barberId ?? undefined,
        couponId: item.couponId ?? undefined,
        quantity: item.quantity,
        price: item.price,
        customPrice:
          item.customPrice === undefined ? undefined : item.customPrice,
      }))
      const haveAppointmentItems = this.checkIfHaveAppointmentItems(addItems)

      if (haveAppointmentItems) {
        await this.checkIfAnyAppointmentAlreadyLinkedToASale(addItems)
      }

      const newItemsBuild = await this.getItemsBuild(
        addItemsFormatted,
        user.unitId,
      )

      if (newItemsBuild.productsToUpdate.length > 0) {
        await this.stockService.ensureAvailability(
          newItemsBuild.productsToUpdate,
        )
      }

      newSaleItems.push(...newItemsBuild.saleItemsBuild)
      productsToUpdate.push(...newItemsBuild.productsToUpdate)
      generalSaleItems.push(...newItemsBuild.saleItemsBuild)
    }

    let currentSaleItemsRebuild = generalSaleItems

    if (saleCurrent.coupon?.id) {
      currentSaleItemsRebuild =
        await this.saleItemsBuildService.applyCouponIfNeeded(
          saleCurrent,
          generalSaleItems,
        )
    }

    newSaleItems = currentSaleItemsRebuild.filter((saleItem) => !saleItem.id)
    const generalSaleItemsWithId = currentSaleItemsRebuild.filter(
      (saleItem) => saleItem.id,
    )

    const newSaleItemsMapped = newSaleItems.map(mapSaleItemToPrismaCreate)

    const totalSaleItemsRebuild = calculateTotal(currentSaleItemsRebuild)
    const grossTotalSaleItemsRebuild = calculateGrossTotal(
      currentSaleItemsRebuild,
    )

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

    await runner.run(async (tx) => {
      if (removeItemIds?.length) {
        await this.removingRelationshipsFromRemovedSaleItems(removeItemIds, tx)
      }

      await this.updateSaleItems(generalSaleItemsWithId, tx)
      await this.updateStockProducts(productsToRestore, productsToUpdate, tx)

      saleUpdate = await this.updateSale(
        id,
        totalSaleItemsRebuild,
        grossTotalSaleItemsRebuild,
        saleCurrent.total,
        newSaleItemsMapped,
        tx,
        removeItemIds,
      )
    })

    this.telemetry?.record({
      operation: 'sale.items.modified',
      saleId: saleUpdate?.id ?? id,
      actorId: performedBy,
      metadata: {
        addedItems: addItems?.length ?? 0,
        removedItems: removeItemIds?.length ?? 0,
        totalSale: totalSaleItemsRebuild,
        grossTotal: grossTotalSaleItemsRebuild,
      },
    })

    return { sale: saleUpdate }
  }
}
