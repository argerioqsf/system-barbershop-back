import { SaleRepository, DetailedSale } from '@/repositories/sale-repository'
import { ServiceRepository } from '@/repositories/service-repository'
import { ProductRepository } from '@/repositories/product-repository'
import { AppointmentRepository } from '@/repositories/appointment-repository'
import { CouponRepository } from '@/repositories/coupon-repository'
import {
  BarberUsersRepository,
  UserFindById,
} from '@/repositories/barber-users-repository'
import { ResponseFindOpenByUnit } from '@/repositories/cash-register-repository'
import { SaleItemRepository } from '@/repositories/sale-item-repository'
import { PlanRepository } from '@/repositories/plan-repository'
import { PlanProfileRepository } from '@/repositories/plan-profile-repository'
import { CreateSaleItem, RemoveAddSaleItemRequest } from './types'
import { PaymentStatus, Prisma } from '@prisma/client'
import { CannotEditPaidSaleError } from '../@errors/sale/cannot-edit-paid-sale-error'
import { applyCouponSale } from './utils/coupon'
import { applyPlanDiscounts } from './utils/plan'
import {
  buildItemData,
  ReturnBuildItemData,
  updateDiscountsOnSaleItem,
} from './utils/item'
import {
  mapToSaleItems,
  calculateTotal,
  updateProductsStock,
} from './utils/sale'
import { prisma } from '@/lib/prisma'

interface UpdateSaleResponse {
  sale?: DetailedSale
}

type ProductsToRestore = { id: string; quantity: number }[]
type ProductsToUpdate = {
  id: string
  quantity: number
}[]

type GetItemsBuildReturn = {
  saleItemsBuild: ReturnBuildItemData[]
  productsToUpdate: ProductsToUpdate
}
export class RemoveAddSaleItemService {
  constructor(
    private repository: SaleRepository,
    private serviceRepository: ServiceRepository,
    private productRepository: ProductRepository,
    private appointmentRepository: AppointmentRepository,
    private couponRepository: CouponRepository,
    private barberUserRepository: BarberUsersRepository,
    private saleItemRepository: SaleItemRepository,
    private planRepository: PlanRepository,
    private planProfileRepository: PlanProfileRepository,
  ) {}

  private async getItemsBuild(
    saleItems: CreateSaleItem[],
    unitId: string,
  ): Promise<GetItemsBuildReturn> {
    const saleItemsBuild: ReturnBuildItemData[] = []
    const productsToUpdate: ProductsToUpdate = []
    for (const saleItem of saleItems) {
      const temp = await buildItemData({
        saleItem,
        serviceRepository: this.serviceRepository,
        productRepository: this.productRepository,
        appointmentRepository: this.appointmentRepository,
        couponRepository: this.couponRepository,
        userUnitId: unitId,
        productsToUpdate,
        barberUserRepository: this.barberUserRepository,
        planRepository: this.planRepository,
      })
      saleItemsBuild.push(temp)
    }
    return { saleItemsBuild, productsToUpdate }
  }

  private async initVerify(
    id: string,
    removeItemIds?: string[],
    addItemsIds?: CreateSaleItem[],
  ): Promise<{
    saleCurrent: NonNullable<DetailedSale>
    user: NonNullable<UserFindById>
    session?: ResponseFindOpenByUnit
    generalSaleItems: ReturnBuildItemData[]
  }> {
    if (!id) throw new Error('Sale ID is required')

    const saleCurrent = await this.repository.findById(id)
    if (!saleCurrent) throw new Error('Sale not found')
    if (saleCurrent.paymentStatus === PaymentStatus.PAID) {
      throw new CannotEditPaidSaleError()
    }

    const user = await this.barberUserRepository.findById(saleCurrent.userId)
    if (!user) throw new Error('User not found')

    const hasItemChanges =
      (addItemsIds && addItemsIds.length > 0) ||
      (removeItemIds && removeItemIds.length > 0)
    if (!hasItemChanges) throw new Error('No item changes detected')

    const currentItemsBuild: GetItemsBuildReturn = await this.getItemsBuild(
      saleCurrent.items,
      user.unitId,
    )
    const generalSaleItems: ReturnBuildItemData[] = [
      ...currentItemsBuild.saleItemsBuild,
    ]

    return { saleCurrent, user, generalSaleItems }
  }

  private async removeItemsFromSaleAndRebuild(
    removeItemIds: string[],
    saleCurrent: DetailedSale,
    productsToRestore: { id: string; quantity: number }[],
    unitId: string,
  ): Promise<{
    currentItemsBuildRemovedItems: ReturnBuildItemData[]
  }> {
    for (const idToRemove of removeItemIds) {
      const found = saleCurrent.items.find((i) => i.id === idToRemove)
      if (found) {
        if (found.productId) {
          productsToRestore.push({
            id: found.productId,
            quantity: found.quantity,
          })
        }
      }
    }

    const saleCurrentRemovedItems = saleCurrent.items.filter(
      (item) => !removeItemIds.includes(item.id),
    )

    const currentItemsBuildRemovedItems: ReturnBuildItemData[] = (
      await this.getItemsBuild(saleCurrentRemovedItems, unitId)
    ).saleItemsBuild

    return {
      currentItemsBuildRemovedItems,
    }
  }

  private async rebuildCurrentSaleItems(
    saleCurrent: DetailedSale,
    currentSaleItemsModified: ReturnBuildItemData[],
  ): Promise<ReturnBuildItemData[]> {
    // TODO: unificar essa logica de rebuild geral de saleItems
    let currentSaleItemsUpdated: ReturnBuildItemData[] =
      currentSaleItemsModified

    if (saleCurrent.coupon?.code) {
      const currentCouponId = saleCurrent.coupon.id
      const { saleItems } = await applyCouponSale(
        currentSaleItemsUpdated,
        currentCouponId,
        this.couponRepository,
      )
      currentSaleItemsUpdated = saleItems
    }

    const saleItemsApplyPlanDiscounts = await applyPlanDiscounts(
      currentSaleItemsUpdated,
      saleCurrent.clientId,
      this.planProfileRepository,
      this.planRepository,
    )

    return saleItemsApplyPlanDiscounts
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
    saleItemRepository: SaleItemRepository,
    tx: Prisma.TransactionClient,
  ) {
    for (const saleItem of saleItems) {
      if (saleItem.id) {
        updateDiscountsOnSaleItem(saleItem, saleItem.id, saleItemRepository, tx)
      }
      if (saleItem.appointment) {
        await this.appointmentRepository.update(saleItem.appointment.id, {
          saleItem: { connect: { id: saleItem.id } },
        })
      }
    }
  }

  private async updateSale(
    saleId: string,
    newTotal: number,
    currentTotal: number,
    newSaleItemsMapped: Prisma.SaleItemCreateWithoutSaleInput[],
    tx: Prisma.TransactionClient,
    removeSaleItemIds?: string[],
  ) {
    return await this.repository.update(
      saleId,
      {
        ...(newTotal !== currentTotal ? { total: newTotal } : {}),
        items: {
          create: newSaleItemsMapped,
          deleteMany: removeSaleItemIds?.map((rid) => ({ id: rid })),
        },
      },
      tx,
    )
  }

  private async updateStockProducts(
    productsToRestore: ProductsToRestore,
    productsToUpdate: ProductsToUpdate,
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

  private async handleRemoveSaleItems(
    removeItemIds: string[],
    saleCurrent: DetailedSale,
    productsToRestore: ProductsToRestore,
    unitId: string,
  ) {
    const { currentItemsBuildRemovedItems } =
      await this.removeItemsFromSaleAndRebuild(
        removeItemIds,
        saleCurrent,
        productsToRestore,
        unitId,
      )
    return { currentItemsBuildRemovedItems }
  }

  async execute({
    id,
    addItemsIds,
    removeItemIds,
  }: RemoveAddSaleItemRequest): Promise<UpdateSaleResponse> {
    let saleUpdate: DetailedSale | undefined
    let newSaleItems: ReturnBuildItemData[] = []
    const productsToUpdate: ProductsToUpdate = []
    const productsToRestore: ProductsToRestore = []

    let { saleCurrent, user, generalSaleItems } = await this.initVerify(
      id,
      removeItemIds,
      addItemsIds,
    )

    if (removeItemIds) {
      const { currentItemsBuildRemovedItems } =
        await this.handleRemoveSaleItems(
          removeItemIds,
          saleCurrent,
          productsToRestore,
          user.unitId,
        )
      generalSaleItems = currentItemsBuildRemovedItems
    }

    if (addItemsIds) {
      const newItemsBuild = await this.getItemsBuild(addItemsIds, user.unitId)
      newSaleItems.push(...newItemsBuild.saleItemsBuild)
      productsToUpdate.push(...newItemsBuild.productsToUpdate)
      generalSaleItems.push(...newSaleItems)
    }

    const currentSaleItemsRebuild = await this.rebuildCurrentSaleItems(
      saleCurrent,
      generalSaleItems,
    )

    newSaleItems = currentSaleItemsRebuild.filter((saleItem) => !saleItem.id)
    const generalSaleItemsWithId = currentSaleItemsRebuild.filter(
      (saleItem) => saleItem.id,
    )

    const newSaleItemsMapped = mapToSaleItems(newSaleItems)

    const totalSaleItemsRebuild = calculateTotal(currentSaleItemsRebuild)

    await prisma.$transaction(async (tx) => {
      if (removeItemIds) {
        await this.removingRelationshipsFromRemovedSaleItems(removeItemIds, tx)
      }
      await this.updateSaleItems(
        generalSaleItemsWithId,
        this.saleItemRepository,
        tx,
      )
      await this.updateStockProducts(productsToRestore, productsToUpdate, tx)
      saleUpdate = await this.updateSale(
        id,
        totalSaleItemsRebuild,
        saleCurrent.total,
        newSaleItemsMapped,
        tx,
        removeItemIds,
      )
    })

    return { sale: saleUpdate }
  }
}
