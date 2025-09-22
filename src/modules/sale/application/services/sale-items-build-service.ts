import {
  SaleRepository,
  DetailedSaleItem,
  DetailedSale,
} from '@/repositories/sale-repository'
import { ServiceRepository } from '@/repositories/service-repository'
import { ProductRepository } from '@/repositories/product-repository'
import { AppointmentRepository } from '@/repositories/appointment-repository'
import { CouponRepository } from '@/repositories/coupon-repository'
import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { PlanRepository } from '@/repositories/plan-repository'
import { PlanProfileRepository } from '@/repositories/plan-profile-repository'
import {
  buildItemData,
  ProductToUpdate,
  ReturnBuildItemData,
  SaleItemBuildItem,
} from '@/services/sale/utils/item'
import { applyCouponSale } from '@/services/sale/utils/coupon'

export interface BuildItemsResult {
  saleItemsBuild: ReturnBuildItemData[]
  productsToUpdate: ProductToUpdate[]
}

export interface SaleItemsBuildServiceDeps {
  serviceRepository: ServiceRepository
  productRepository: ProductRepository
  appointmentRepository: AppointmentRepository
  couponRepository: CouponRepository
  barberUserRepository: BarberUsersRepository
  planRepository: PlanRepository
  saleRepository: SaleRepository
  planProfileRepository: PlanProfileRepository
}

export class SaleItemsBuildService {
  constructor(private readonly deps: SaleItemsBuildServiceDeps) {}

  async buildSaleItemsForUnit(
    saleItems: SaleItemBuildItem[],
    unitId: string,
  ): Promise<BuildItemsResult> {
    const saleItemsBuild: ReturnBuildItemData[] = []
    const productsToUpdate: ProductToUpdate[] = []

    for (const saleItem of saleItems) {
      const built = await buildItemData({
        saleItem,
        serviceRepository: this.deps.serviceRepository,
        productRepository: this.deps.productRepository,
        appointmentRepository: this.deps.appointmentRepository,
        couponRepository: this.deps.couponRepository,
        userUnitId: unitId,
        productsToUpdate,
        barberUserRepository: this.deps.barberUserRepository,
        planRepository: this.deps.planRepository,
        saleRepository: this.deps.saleRepository,
        planProfileRepository: this.deps.planProfileRepository,
      })
      saleItemsBuild.push(built)
    }

    return { saleItemsBuild, productsToUpdate }
  }

  async buildFromSale(
    sale: DetailedSale,
    unitId: string,
  ): Promise<BuildItemsResult> {
    const saleItemsPayload = sale.items.map((item) =>
      this.mapDetailedSaleItemToBuild(sale.id, item),
    )
    return this.buildSaleItemsForUnit(saleItemsPayload, unitId)
  }

  async applyCouponIfNeeded(
    sale: DetailedSale,
    items: ReturnBuildItemData[],
  ): Promise<ReturnBuildItemData[]> {
    if (!sale.coupon?.id) return items

    const { saleItems } = await applyCouponSale(
      items,
      sale.coupon.id,
      this.deps.couponRepository,
      sale.unitId,
    )

    return saleItems
  }

  private mapDetailedSaleItemToBuild(
    saleId: string,
    item: DetailedSaleItem,
  ): SaleItemBuildItem {
    return {
      saleId,
      id: item.id,
      serviceId: item.serviceId ?? undefined,
      productId: item.productId ?? undefined,
      appointmentId: item.appointmentId ?? undefined,
      planId: item.planId ?? undefined,
      barberId: item.barberId ?? undefined,
      couponId: item.couponId ?? undefined,
      quantity: item.quantity,
      price: item.price,
      customPrice: item.customPrice ?? undefined,
    }
  }
}
