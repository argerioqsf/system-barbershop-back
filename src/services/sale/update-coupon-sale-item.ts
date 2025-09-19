import { SaleRepository, DetailedSale } from '@/repositories/sale-repository'
import { ServiceRepository } from '@/repositories/service-repository'
import { ProductRepository } from '@/repositories/product-repository'
import { AppointmentRepository } from '@/repositories/appointment-repository'
import { CouponRepository } from '@/repositories/coupon-repository'
import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import {
  DetailedSaleItemFindById,
  SaleItemRepository,
} from '@/repositories/sale-item-repository'
import { PlanRepository } from '@/repositories/plan-repository'
import { PlanProfileRepository } from '@/repositories/plan-profile-repository'
import { SaleItemUpdateFields, UpdateSaleItemRequest } from './types'
import { PaymentStatus, Prisma, SaleItem } from '@prisma/client'
import {
  buildItemData,
  mountSaleItemUpdate,
  ProductToUpdate,
  ReturnBuildItemData,
  SaleItemBuildItem,
} from './utils/item'
import {
  mapToSaleItemsForUpdate,
  GetItemsBuildReturn,
  recalculateSaleTotalsOnItemChange,
} from './utils/sale'
import { prisma } from '@/lib/prisma'
import { CannotEditPaidSaleItemError } from '../@errors/sale/cannot-edit-paid-sale-item-error'
import { CannotEditPaidSaleError } from '../@errors/sale/cannot-edit-paid-sale-error'
import { CouponNotFoundError } from '../@errors/coupon/coupon-not-found-error'

interface UpdateSaleResponse {
  sale?: DetailedSale
  saleItems?: SaleItem[]
}

export class UpdateCouponSaleItemService {
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
    if (
      saleItemUpdateFields.couponCode === undefined &&
      saleItemUpdateFields.couponId === undefined
    ) {
      throw new Error('CouponCode or couponId is required')
    }

    if (saleItemUpdateFields.couponCode) {
      const coupon = await this.couponRepository.findByCode(
        saleItemUpdateFields.couponCode,
      )
      if (!coupon) throw CouponNotFoundError
      saleItemUpdateFields.couponId = coupon.id

      if (saleItemUpdateFields.quantity === 0) {
        throw new Error('The quantity must be greater than 0')
      }
    }

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

  async execute({
    id,
    saleItemUpdateFields,
  }: UpdateSaleItemRequest): Promise<UpdateSaleResponse> {
    let saleUpdate: DetailedSale | undefined
    let salesItemsUpdate: SaleItem[] | undefined
    let saleItemsToUpdate: ReturnBuildItemData[] = []

    // 1) Veirificações iniciais
    const { saleItemCurrent } = await this.initVerify(id, saleItemUpdateFields)
    const saleItemUpdated = mountSaleItemUpdate(
      saleItemUpdateFields,
      saleItemCurrent,
    )

    // 2) Recalcular os valores da venda e dos itens
    const rebuild = await recalculateSaleTotalsOnItemChange(
      saleItemCurrent,
      saleItemUpdated,
      this.getItemBuild.bind(this),
      this.getItemsBuild.bind(this),
      this.saleRepository,
      this.couponRepository,
    )

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
    })

    return { sale: saleUpdate, saleItems: salesItemsUpdate }
  }
}
