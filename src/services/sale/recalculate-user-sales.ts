import { SaleRepository } from '@/repositories/sale-repository'
import { SaleItemRepository } from '@/repositories/sale-item-repository'
import { PlanRepository } from '@/repositories/plan-repository'
import { PlanProfileRepository } from '@/repositories/plan-profile-repository'
import { CouponRepository } from '@/repositories/coupon-repository'
import { ServiceRepository } from '@/repositories/service-repository'
import { ProductRepository } from '@/repositories/product-repository'
import { AppointmentRepository } from '@/repositories/appointment-repository'
import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { rebuildSaleItems, calculateTotal } from './utils/sale'
import {
  updateDiscountsOnSaleItem,
  ReturnBuildItemData,
  buildItemData,
} from './utils/item'

interface RecalculateUserSalesRequest {
  userIds: string[]
}

export class RecalculateUserSalesService {
  constructor(
    private saleRepository: SaleRepository,
    private saleItemRepository: SaleItemRepository,
    private planRepository: PlanRepository,
    private planProfileRepository: PlanProfileRepository,
    private couponRepository: CouponRepository,
    private serviceRepository: ServiceRepository,
    private productRepository: ProductRepository,
    private appointmentRepository: AppointmentRepository,
    private barberUserRepository: BarberUsersRepository,
  ) {}

  async execute(
    { userIds }: RecalculateUserSalesRequest,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    if (userIds.length === 0) return
    const sales = await this.saleRepository.findMany({
      clientId: { in: userIds },
    })

    for (const sale of sales) {
      const itemsBuild: ReturnBuildItemData[] = []
      for (const item of sale.items) {
        const build = await buildItemData({
          saleItem: {
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
          },
          serviceRepository: this.serviceRepository,
          productRepository: this.productRepository,
          appointmentRepository: this.appointmentRepository,
          couponRepository: this.couponRepository,
          userUnitId: sale.unitId,
          productsToUpdate: [],
          barberUserRepository: this.barberUserRepository,
          planRepository: this.planRepository,
        })
        build.discounts = item.discounts.map((d) => ({
          amount: d.amount,
          type: d.type,
          origin: d.origin,
          order: d.order,
        }))
        itemsBuild.push(build)
      }
      const rebuilt = await rebuildSaleItems(itemsBuild, {
        couponId: sale.coupon?.id ?? undefined,
        clientId: sale.clientId,
        planProfileRepository: this.planProfileRepository,
        planRepository: this.planRepository,
        couponRepository: this.couponRepository,
      })

      const total = calculateTotal(rebuilt)

      const run = async (trx: Prisma.TransactionClient) => {
        for (const item of rebuilt) {
          if (item.id) {
            await updateDiscountsOnSaleItem(
              item,
              item.id,
              this.saleItemRepository,
              trx,
            )
          }
        }
        if (total !== sale.total) {
          await this.saleRepository.update(sale.id, { total }, trx)
        }
      }

      if (tx) {
        await run(tx)
      } else {
        await prisma.$transaction(async (trx) => {
          await run(trx)
        })
      }
    }
  }
}
