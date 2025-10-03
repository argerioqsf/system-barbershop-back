import { SaleRepository, DetailedSale } from '@/repositories/sale-repository'
import { ProductRepository } from '@/repositories/product-repository'
import { AppointmentRepository } from '@/repositories/appointment-repository'
import {
  BarberUsersRepository,
  UserFindById,
} from '@/repositories/barber-users-repository'
import { SaleItemRepository } from '@/repositories/sale-item-repository'
import {
  ProductToUpdate,
  ReturnBuildItemData,
  SaleItemBuildItem,
  updateDiscountsOnSaleItem,
  verifyStockProducts,
} from '@/services/sale/utils/item'
import {
  mapToSaleItems,
  calculateTotal,
  updateProductsStock,
  calculateGrossTotal,
} from '@/services/sale/utils/sale'
import { CreateSaleItem, RemoveAddSaleItemRequest } from '@/services/sale/types'
import { CannotEditPaidSaleError } from '@/services/@errors/sale/cannot-edit-paid-sale-error'
import { PaymentStatus, Prisma } from '@prisma/client'
import {
  BuildItemsResult,
  SaleItemsBuildService,
} from '../services/sale-items-build-service'
import { SaleTelemetry } from '@/modules/sale/application/contracts/sale-telemetry'
import { logger } from '@/lib/logger'
import { AppointmentAlreadyLinkedError } from '@/services/@errors/appointment/appointment-already-linked-error'

export type TransactionRunner = <T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
) => Promise<T>

interface UpdateSaleResponse {
  sale?: DetailedSale
}

type ProductsToRestore = { id: string; quantity: number }

export class RemoveAddSaleItemUseCase {
  constructor(
    private readonly saleRepository: SaleRepository,
    private readonly productRepository: ProductRepository,
    private readonly appointmentRepository: AppointmentRepository,
    private readonly barberUserRepository: BarberUsersRepository,
    private readonly saleItemRepository: SaleItemRepository,
    private readonly saleItemsBuildService: SaleItemsBuildService,
    private readonly runInTransaction: TransactionRunner,
    private readonly telemetry?: SaleTelemetry,
  ) {}

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
    if (saleCurrent.paymentStatus === PaymentStatus.PAID) {
      throw new CannotEditPaidSaleError()
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

    return (await this.getItemsBuild(saleCurrentRemovedItems, unitId))
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
    for (const saleItem of saleItems) {
      if (saleItem.id) {
        await updateDiscountsOnSaleItem(
          saleItem,
          saleItem.id,
          this.saleItemRepository,
          tx,
        )
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
    await updateProductsStock(
      this.productRepository,
      productsToUpdate,
      'decrement',
      tx,
    )

    await updateProductsStock(
      this.productRepository,
      productsToRestore,
      'increment',
      tx,
    )
  }

  async execute({
    id,
    addItems,
    removeItemIds,
    performedBy,
  }: RemoveAddSaleItemRequest): Promise<UpdateSaleResponse> {
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
        ...item,
        saleId: id,
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
        await verifyStockProducts(
          this.productRepository,
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

    const newSaleItemsMapped = mapToSaleItems(newSaleItems)

    const totalSaleItemsRebuild = calculateTotal(currentSaleItemsRebuild)
    const grossTotalSaleItemsRebuild = calculateGrossTotal(
      currentSaleItemsRebuild,
    )

    await this.runInTransaction(async (tx) => {
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
