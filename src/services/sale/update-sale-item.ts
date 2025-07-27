import { SaleRepository, DetailedSale } from '@/repositories/sale-repository'
import { ServiceRepository } from '@/repositories/service-repository'
import { ProductRepository } from '@/repositories/product-repository'
import { AppointmentRepository } from '@/repositories/appointment-repository'
import { CouponRepository } from '@/repositories/coupon-repository'
import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import {
  DetailedSaleItemFindById,
  DetailedSaleItemFindMany,
  SaleItemRepository,
} from '@/repositories/sale-item-repository'
import { PlanRepository } from '@/repositories/plan-repository'
import { PlanProfileRepository } from '@/repositories/plan-profile-repository'
import {
  CreateSaleItem,
  SaleItemUpdateFields,
  UpdateSaleItemRequest,
} from './types'
import {
  DiscountOrigin,
  DiscountType,
  PaymentStatus,
  Prisma,
  SaleItem,
} from '@prisma/client'
import { applyPlanDiscounts } from './utils/plan'
import { buildItemData, ReturnBuildItemData } from './utils/item'
import {
  mapToSaleItemsForUpdate,
  updateProductsStock,
  rebuildSaleItems,
} from './utils/sale'
import { prisma } from '@/lib/prisma'
import { CannotEditPaidSaleItemError } from '../@errors/sale/cannot-edit-paid-sale-item-error'
import { SaleNotFoundError } from '../@errors/sale/sale-not-found-error'
import { CannotEditPaidSaleError } from '../@errors/sale/cannot-edit-paid-sale-error'

interface UpdateSaleResponse {
  sale?: DetailedSale
  saleItems?: SaleItem[]
}

type ProductToRestore = { id: string; quantity: number }
type ProductToUpdate = {
  id: string
  quantity: number
}

type GetItemsBuildReturn = {
  saleItemsBuild: ReturnBuildItemData[]
}
export class UpdateSaleItemService {
  constructor(
    private repository: SaleItemRepository,
    private serviceRepository: ServiceRepository,
    private productRepository: ProductRepository,
    private appointmentRepository: AppointmentRepository,
    private couponRepository: CouponRepository,
    private barberUserRepository: BarberUsersRepository,
    private saleRepository: SaleRepository,
    private planRepository: PlanRepository,
    private planProfileRepository: PlanProfileRepository,
  ) {}

  private async getItemBuild(
    saleItem: CreateSaleItem,
    unitId: string,
  ): Promise<ReturnBuildItemData> {
    const productsToUpdate: ProductToUpdate[] = []
    return await buildItemData({
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
  }

  private async getItemsBuild(
    saleItems: CreateSaleItem[],
    unitId: string,
  ): Promise<GetItemsBuildReturn> {
    const saleItemsBuild: ReturnBuildItemData[] = []
    for (const saleItem of saleItems) {
      const temp = await this.getItemBuild(saleItem, unitId)
      saleItemsBuild.push(temp)
    }
    return { saleItemsBuild }
  }

  private async initVerify(id: string): Promise<{
    saleItemCurrent: NonNullable<DetailedSaleItemFindById>
  }> {
    if (!id) throw new Error('SaleItem ID is required')

    const saleItemCurrent = await this.repository.findById(id)
    if (!saleItemCurrent) throw new Error('Sale Item not found')
    if (saleItemCurrent.commissionPaid === true) {
      throw new CannotEditPaidSaleItemError()
    }
    if (saleItemCurrent.sale.paymentStatus === PaymentStatus.PAID) {
      throw new CannotEditPaidSaleError()
    }

    return { saleItemCurrent }
  }

  private async updateSaleItems(
    saleItems: {
      id: string
      data: Prisma.SaleItemUpdateInput
    }[],
    tx: Prisma.TransactionClient,
  ): Promise<SaleItem[]> {
    return await this.repository.updateManyIndividually(saleItems, tx)
  }

  private async updateSaleTotal(
    saleId: string,
    total: number,
    tx: Prisma.TransactionClient,
  ) {
    return await this.saleRepository.update(
      saleId,
      {
        total,
      },
      tx,
    )
  }

  private async updateStockProducts(
    productsToRestore: ProductToRestore[],
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

  private haveADiscountCouponSaleValue(saleItem: ReturnBuildItemData) {
    const discountsCouponSaleTypeValue = saleItem.discounts.filter(
      (discount) =>
        discount.origin === DiscountOrigin.COUPON_SALE &&
        discount.type === DiscountType.VALUE,
    )
    return discountsCouponSaleTypeValue.length > 0
  }

  private mountSaleItemUpdate(
    saleItemUpdateFields: SaleItemUpdateFields,
    saleItemCurrent: NonNullable<DetailedSaleItemFindMany>,
  ): CreateSaleItem {
    return {
      id: saleItemCurrent.id,
      price: saleItemCurrent.price,
      quantity:
        saleItemUpdateFields.quantity !== undefined
          ? saleItemUpdateFields.quantity
          : saleItemCurrent.quantity,
      appointmentId:
        saleItemUpdateFields.appointmentId !== undefined
          ? saleItemUpdateFields.appointmentId
          : saleItemCurrent.appointmentId,
      barberId:
        saleItemUpdateFields.barberId !== undefined
          ? saleItemUpdateFields.barberId
          : saleItemCurrent.barberId,
      couponId:
        saleItemUpdateFields.couponId !== undefined
          ? saleItemUpdateFields.couponId
          : saleItemCurrent.couponId,
      customPrice:
        saleItemUpdateFields.customPrice !== undefined
          ? saleItemUpdateFields.customPrice
          : saleItemCurrent.customPrice,
      planId:
        saleItemUpdateFields.planId !== undefined
          ? saleItemUpdateFields.planId
          : saleItemCurrent.planId,
      productId:
        saleItemUpdateFields.productId !== undefined
          ? saleItemUpdateFields.productId
          : saleItemCurrent.productId,
      serviceId:
        saleItemUpdateFields.serviceId !== undefined
          ? saleItemUpdateFields.serviceId
          : saleItemCurrent.serviceId,
    }
  }

  private async rebuildSaleIfNeeded(
    saleItemCurrent: NonNullable<DetailedSaleItemFindById>,
    saleItemUpdated: CreateSaleItem,
    itemWithPlan: ReturnBuildItemData,
  ): Promise<{ items: ReturnBuildItemData[]; total?: number }> {
    let items = [itemWithPlan]
    let total: number | undefined

    if (itemWithPlan.price !== saleItemCurrent.price) {
      const currentSale = await this.saleRepository.findById(
        saleItemCurrent.saleId,
      )
      if (!currentSale) throw new SaleNotFoundError()

      if (this.haveADiscountCouponSaleValue(saleItemCurrent)) {
        const saleItemsWithUpdate = currentSale.items.map((saleItem) =>
          saleItem.id === saleItemCurrent.id
            ? { ...saleItem, ...saleItemUpdated }
            : saleItem,
        )

        const { saleItemsBuild } = await this.getItemsBuild(
          saleItemsWithUpdate,
          currentSale.unitId,
        )

        items = await rebuildSaleItems(saleItemsBuild, {
          couponId: currentSale.coupon?.id,
          clientId: currentSale.clientId,
          planProfileRepository: this.planProfileRepository,
          planRepository: this.planRepository,
          couponRepository: this.couponRepository,
        })
      }

      total = currentSale.total + (itemWithPlan.price - saleItemCurrent.price)
    }

    return { items, total }
  }

  async execute({
    id,
    saleItemUpdateFields,
  }: UpdateSaleItemRequest): Promise<UpdateSaleResponse> {
    let saleUpdate: DetailedSale | undefined
    let salesItemsUpdate: SaleItem[] | undefined
    let productToUpdate: ProductToUpdate | undefined
    let productToRestore: ProductToRestore | undefined
    let saleItemsToUpdate: ReturnBuildItemData[] = []
    const { saleItemCurrent } = await this.initVerify(id)
    const saleItemUpdated = this.mountSaleItemUpdate(
      saleItemUpdateFields,
      saleItemCurrent,
    )

    const saleItemUpdatedBuilded = await this.getItemBuild(
      saleItemUpdated,
      saleItemCurrent.sale.unitId,
    )

    const saleItemsApplyPlanDiscounts = await applyPlanDiscounts(
      [saleItemUpdatedBuilded],
      saleItemCurrent.sale.clientId,
      this.planProfileRepository,
      this.planRepository,
    )

    saleItemsToUpdate = saleItemsApplyPlanDiscounts

    if (saleItemUpdated.productId !== saleItemCurrent.productId) {
      if (saleItemUpdated.productId) {
        productToUpdate = {
          id: saleItemUpdated.productId,
          quantity: saleItemUpdated.quantity,
        }
      }
      if (saleItemCurrent.productId) {
        productToRestore = {
          id: saleItemCurrent.productId,
          quantity: saleItemUpdated.quantity,
        }
      }
    }

    const rebuild = await this.rebuildSaleIfNeeded(
      saleItemCurrent,
      saleItemUpdated,
      saleItemsApplyPlanDiscounts[0],
    )
    saleItemsToUpdate = rebuild.items
    const saleTotalUpdated = rebuild.total

    const saleItemUpdatedBuildedMapped = mapToSaleItemsForUpdate(
      saleItemsToUpdate,
    )
      .filter((saleItems) => saleItems.id)
      .map(
        (
          saleItem,
        ): {
          id: string
          data: Prisma.SaleItemUpdateInput
        } => ({
          id: saleItem.id as string,
          data: saleItem,
        }),
      )

    await prisma.$transaction(async (tx) => {
      salesItemsUpdate = await this.updateSaleItems(
        saleItemUpdatedBuildedMapped,
        tx,
      )

      if (saleTotalUpdated && saleTotalUpdated >= 0) {
        saleUpdate = await this.updateSaleTotal(
          saleItemCurrent.saleId,
          saleTotalUpdated,
          tx,
        )
      }
      const productsToRestore = productToRestore ? [productToRestore] : []
      const productsToUpdate = productToUpdate ? [productToUpdate] : []
      await this.updateStockProducts(productsToRestore, productsToUpdate, tx)
    })

    return { sale: saleUpdate, saleItems: salesItemsUpdate }
  }
}
