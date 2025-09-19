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
import { PaymentStatus, Prisma, SaleItem } from '@prisma/client'
import {
  buildItemData,
  calculateRealValueSaleItem,
  ProductToUpdate,
  ReturnBuildItemData,
  SaleItemBuildItem,
  verifyStockProducts,
} from './utils/item'
import {
  mapToSaleItemsForUpdate,
  updateProductsStock,
  calculateTotal,
  calculateGrossTotal,
} from './utils/sale'
import { prisma } from '@/lib/prisma'
import { CannotEditPaidSaleItemError } from '../@errors/sale/cannot-edit-paid-sale-item-error'
import { SaleNotFoundError } from '../@errors/sale/sale-not-found-error'
import { CannotEditPaidSaleError } from '../@errors/sale/cannot-edit-paid-sale-error'
import { CouponNotFoundError } from '../@errors/coupon/coupon-not-found-error'
import { applyCouponSale } from './utils/coupon'

interface UpdateSaleResponse {
  sale?: DetailedSale
  saleItems?: SaleItem[]
}

type ProductToRestore = { id: string; quantity: number }

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
    saleItem: SaleItemBuildItem,
    unitId: string,
  ): Promise<{
    saleItemBuild: ReturnBuildItemData
    productsToUpdate: ProductToUpdate[]
  }> {
    const productsToUpdate: ProductToUpdate[] = []
    const saleItemBuild = await buildItemData({
      saleItem,
      serviceRepository: this.serviceRepository,
      productRepository: this.productRepository,
      appointmentRepository: this.appointmentRepository,
      couponRepository: this.couponRepository,
      userUnitId: unitId,
      productsToUpdate,
      barberUserRepository: this.barberUserRepository,
      planRepository: this.planRepository,
      saleRepository: this.saleRepository,
      planProfileRepository: this.planProfileRepository,
    })
    return { saleItemBuild, productsToUpdate }
  }

  private async getItemsBuild(
    saleItems: SaleItemBuildItem[],
    unitId: string,
  ): Promise<GetItemsBuildReturn> {
    const saleItemsBuild: ReturnBuildItemData[] = []
    for (const saleItem of saleItems) {
      const { saleItemBuild: saleItemsBuild_ } = await this.getItemBuild(
        saleItem,
        unitId,
      )
      saleItemsBuild.push(saleItemsBuild_)
    }
    return { saleItemsBuild }
  }

  private async initVerify(
    id: string,
    saleItemUpdateFields: SaleItemUpdateFields,
  ): Promise<{
    saleItemCurrent: NonNullable<DetailedSaleItemFindById>
  }> {
    if (saleItemUpdateFields.couponCode) {
      const coupon = await this.couponRepository.findByCode(
        saleItemUpdateFields.couponCode,
      )
      if (!coupon) throw CouponNotFoundError
      saleItemUpdateFields.couponId = coupon.id
    }

    if (saleItemUpdateFields.quantity === 0) {
      throw new Error('The quantity must be greater than 0')
    }
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
    gross_total: number,
    tx: Prisma.TransactionClient,
  ) {
    return await this.saleRepository.update(
      saleId,
      {
        total,
        gross_value: gross_total,
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

  private getRealPriceItem(
    saleItemUpdated:
      | ReturnBuildItemData
      | NonNullable<DetailedSaleItemFindById>,
  ): number {
    return calculateRealValueSaleItem(
      saleItemUpdated.price,
      saleItemUpdated.discounts,
    )
  }

  private async rebuildSaleIfNeeded(
    saleItemCurrent: NonNullable<DetailedSaleItemFindById>,
    saleItemUpdated: CreateSaleItem,
  ): Promise<{
    itemsForUpdate: ReturnBuildItemData[]
    totalSale: number
    grossTotalSale: number
  }> {
    const { saleItemBuild: saleItemUpdatedBuilded } = await this.getItemBuild(
      {
        ...saleItemUpdated,
        saleId: saleItemCurrent.saleId,
      },
      saleItemCurrent.sale.unitId,
    )
    let itemsForUpdate = [saleItemUpdatedBuilded]
    const priceSaleItemWithAllDiscounts = this.getRealPriceItem(
      saleItemUpdatedBuilded,
    )
    console.log('saleItemUpdatedBuilded: ', saleItemUpdatedBuilded)

    const currentSale = await this.saleRepository.findById(
      saleItemCurrent.saleId,
    )
    const { saleItemBuild: saleItemCurrentBuilded } = await this.getItemBuild(
      {
        ...saleItemCurrent,
        saleId: saleItemCurrent.saleId,
      },
      saleItemCurrent.sale.unitId,
    )
    const priceSaleItemCurrent = this.getRealPriceItem(saleItemCurrentBuilded)
    console.log('saleItemCurrentBuilded: ', saleItemCurrentBuilded)
    console.log('saleItemCurrent: ', saleItemCurrent)

    if (!currentSale) throw new SaleNotFoundError()
    let totalSale = currentSale.total
    let grossTotalSale = currentSale.gross_value

    // 3.1) Verifica se foi alterado o valor da sale alterada
    if (priceSaleItemWithAllDiscounts !== priceSaleItemCurrent) {
      console.log('Rebuild sale com cupom')
      if (currentSale.couponId) {
        console.log('Sale com cupom, rebuild de todos os items')
        // console.log('currentSaleItem couponId: ', currentSale.items[0].couponId)
        // console.log('saleItemUpdated couponId: ', saleItemUpdated)
        const saleItemsWithUpdate: SaleItemBuildItem[] = currentSale.items.map(
          (saleItem) =>
            saleItem.id === saleItemCurrent.id
              ? {
                  ...saleItem,
                  ...saleItemUpdated,
                  saleId: currentSale.id,
                  discounts: [],
                }
              : { ...saleItem, saleId: currentSale.id, discounts: [] },
        )

        const { saleItemsBuild: saleItemsRebuild } = await this.getItemsBuild(
          saleItemsWithUpdate,
          currentSale.unitId,
        )
        const { saleItems: saleItemsWithCouponSale } = await applyCouponSale(
          saleItemsRebuild,
          currentSale.couponId,
          this.couponRepository,
        )
        console.log('saleItemsWithCouponSale 2: ', saleItemsWithCouponSale[0])
        // console.log('saleItemsWithCouponSale: ', saleItemsWithCouponSale)
        itemsForUpdate = saleItemsWithCouponSale
        totalSale = calculateTotal(saleItemsWithCouponSale)
        grossTotalSale = calculateGrossTotal(saleItemsWithCouponSale)
      } else {
        totalSale =
          currentSale.total +
          (priceSaleItemWithAllDiscounts - priceSaleItemCurrent)
        grossTotalSale =
          currentSale.gross_value +
          (saleItemUpdatedBuilded.basePrice - saleItemCurrent.price)
      }
    }

    return { itemsForUpdate, totalSale, grossTotalSale }
  }

  private async handlerProductStock(
    saleItemUpdated: CreateSaleItem,
    saleItemCurrent: NonNullable<DetailedSaleItemFindById>,
  ): Promise<{
    productToRestoreUp: ProductToRestore | null
    productToUpdateUp: ProductToUpdate | null
  }> {
    let productToUpdate: ProductToUpdate | null = null
    let productToRestore: ProductToRestore | null = null

    if (saleItemUpdated.productId) {
      if (saleItemUpdated.productId !== saleItemCurrent.productId) {
        if (saleItemUpdated.productId) {
          productToUpdate = {
            id: saleItemUpdated.productId,
            quantity: saleItemUpdated.quantity,
            saleItemId: saleItemUpdated.id ?? '',
          }
        }
        if (saleItemCurrent.productId) {
          productToRestore = {
            id: saleItemCurrent.productId,
            quantity: saleItemCurrent.quantity,
          }
        }
      } else {
        const difQuantity = saleItemUpdated.quantity - saleItemCurrent.quantity
        const productToUp: ProductToUpdate = {
          id: saleItemUpdated.productId,
          quantity: difQuantity,
          saleItemId: saleItemCurrent.id,
        }
        if (difQuantity > 0) {
          productToUpdate = productToUp
          await verifyStockProducts(this.productRepository, [productToUp])
        } else if (difQuantity < 0) {
          productToUp.quantity = -productToUp.quantity
          productToRestore = productToUp
        }
      }
    }
    return {
      productToRestoreUp: productToRestore,
      productToUpdateUp: productToUpdate,
    }
  }

  // TODO: separar essa rota de update e varias rotas de pequenos updates, para simplificar a manutencao
  // ja iniciei, agora precisar terminar
  async execute({
    id,
    saleItemUpdateFields,
  }: UpdateSaleItemRequest): Promise<UpdateSaleResponse> {
    let saleUpdate: DetailedSale | undefined
    let salesItemsUpdate: SaleItem[] | undefined
    let saleItemsToUpdate: ReturnBuildItemData[] = []

    // 1) Veirificações iniciais
    const { saleItemCurrent } = await this.initVerify(id, saleItemUpdateFields)
    const saleItemUpdated = this.mountSaleItemUpdate(
      saleItemUpdateFields,
      saleItemCurrent,
    )

    // 3) analisa se teve alteracao de valor na sale, e recalcula o cupom da sale se precisar
    const rebuild = await this.rebuildSaleIfNeeded(
      saleItemCurrent,
      saleItemUpdated,
    )

    // 4) analisa se teve alteração de produto ou quantidade de produto, para fazer o controle de estoque
    const { productToRestoreUp, productToUpdateUp } =
      await this.handlerProductStock(saleItemUpdated, saleItemCurrent)
    const productToUpdate: ProductToUpdate | null = productToUpdateUp
    const productToRestore: ProductToRestore | null = productToRestoreUp

    saleItemsToUpdate = rebuild.itemsForUpdate
    const saleTotalUpdated = rebuild.totalSale
    const saleGrossTotalUpdated = rebuild.grossTotalSale

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
          saleGrossTotalUpdated ?? 0,
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
