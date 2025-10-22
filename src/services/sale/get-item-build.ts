import { SaleRepository } from '@/repositories/sale-repository'
import { GetItemBuildRequest, GetItemBuildResponse } from './types'
import { ServiceRepository } from '@/repositories/service-repository'
import { ProductRepository } from '@/repositories/product-repository'
import { AppointmentRepository } from '@/repositories/appointment-repository'
import { ProductToUpdate } from '@/modules/sale/application/dto/sale-item-dto'
import { SaleItemDataBuilder } from '@/modules/sale/application/services/sale-item-data-builder'
import { CouponRepository } from '@/repositories/coupon-repository'
import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { PlanRepository } from '@/repositories/plan-repository'
import { PlanProfileRepository } from '@/repositories/plan-profile-repository'

export class GetItemBuildService {
  constructor(
    private serviceRepository: ServiceRepository,
    private productRepository: ProductRepository,
    private appointmentRepository: AppointmentRepository,
    private couponRepository: CouponRepository,
    private barberUserRepository: BarberUsersRepository,
    private planRepository: PlanRepository,
    private saleRepository: SaleRepository,
    private planProfileRepository: PlanProfileRepository,
  ) {}

  async execute({
    saleItem,
    unitId,
  }: GetItemBuildRequest): Promise<GetItemBuildResponse> {
    const productsToUpdate: ProductToUpdate[] = []
    const builder = new SaleItemDataBuilder({
      serviceRepository: this.serviceRepository,
      productRepository: this.productRepository,
      appointmentRepository: this.appointmentRepository,
      couponRepository: this.couponRepository,
      barberUserRepository: this.barberUserRepository,
      planRepository: this.planRepository,
      saleRepository: this.saleRepository,
      planProfileRepository: this.planProfileRepository,
    })

    const saleItemBuild = await builder.build(saleItem, {
      userUnitId: unitId,
      productsToUpdate,
    })
    return { saleItemBuild, productsToUpdate }
  }
}
