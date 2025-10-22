import {
  SaleRepository,
  DetailedSale,
} from '@/modules/sale/application/ports/sale-repository'
import { ServiceRepository } from '@/modules/sale/application/ports/service-repository'
import { ProductRepository } from '@/modules/sale/application/ports/product-repository'
import { AppointmentRepository } from '@/modules/sale/application/ports/appointment-repository'
import { CouponRepository } from '@/modules/sale/application/ports/coupon-repository'
import { BarberUsersRepository } from '@/modules/sale/application/ports/barber-users-repository'
import { PlanRepository } from '@/modules/sale/application/ports/plan-repository'
import { PlanProfileRepository } from '@/modules/sale/application/ports/plan-profile-repository'
import {
  ProductToUpdate,
  ReturnBuildItemData,
  SaleItemBuildItem,
} from '@/modules/sale/application/dto/sale-item-dto'
import { SaleItemDataBuilder } from '@/modules/sale/application/services/sale-item-data-builder'
import { CouponService } from '@/modules/sale/application/services/coupon-service'
import { mapDetailedSaleItemToBuild } from '@/modules/sale/infra/mappers/sale-item-mapper'

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
  private readonly saleItemDataBuilder: SaleItemDataBuilder
  private readonly couponService: CouponService

  constructor(private readonly deps: SaleItemsBuildServiceDeps) {
    this.saleItemDataBuilder = new SaleItemDataBuilder(deps)
    this.couponService = new CouponService({
      couponRepository: deps.couponRepository,
    })
  }

  async buildSaleItemsForUnit(
    saleItems: SaleItemBuildItem[],
    unitId: string,
  ): Promise<BuildItemsResult> {
    const saleItemsBuild: ReturnBuildItemData[] = []
    const productsToUpdate: ProductToUpdate[] = []

    for (const saleItem of saleItems) {
      const built = await this.saleItemDataBuilder.build(saleItem, {
        userUnitId: unitId,
        productsToUpdate,
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
      mapDetailedSaleItemToBuild(sale.id, item),
    )
    return this.buildSaleItemsForUnit(saleItemsPayload, unitId)
  }

  async applyCouponIfNeeded(
    sale: DetailedSale,
    items: ReturnBuildItemData[],
  ): Promise<ReturnBuildItemData[]> {
    if (!sale.coupon?.id) return items

    const { saleItems } = await this.couponService.applyToSale({
      saleItems: items,
      couponId: sale.coupon.id,
      userUnitId: sale.unitId,
    })

    return saleItems
  }
}
