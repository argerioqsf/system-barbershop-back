import { SaleRepository, DetailedSaleItem } from '@/repositories/sale-repository'
import { SaleItemRepository } from '@/repositories/sale-item-repository'
import { PlanRepository } from '@/repositories/plan-repository'
import { PlanProfileRepository } from '@/repositories/plan-profile-repository'
import { CouponRepository } from '@/repositories/coupon-repository'
import { prisma } from '@/lib/prisma'
import { rebuildSaleItems, calculateTotal } from './utils/sale'
import { updateDiscountsOnSaleItem, ReturnBuildItemData } from './utils/item'
import { Discount } from '@prisma/client'

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
  ) {}

  private mapToBuildItems(saleItems: DetailedSaleItem[]): ReturnBuildItemData[] {
    return saleItems.map((item) => {
      let basePrice = item.price
      if (item.service) {
        basePrice = (item.service.price ?? 0) * item.quantity
      } else if (item.product) {
        basePrice = (item.product.price ?? 0) * item.quantity
      } else if (item.plan) {
        basePrice = item.plan.price
      }

      return {
        id: item.id,
        coupon: item.coupon,
        quantity: item.quantity,
        service: item.service,
        product: item.product,
        plan: item.plan,
        barber: item.barber as any,
        price: basePrice,
        customPrice: item.customPrice,
        discounts: [],
        appointment: item.appointment,
        commissionPaid: item.commissionPaid,
      }
    })
  }

  async execute({ userIds }: RecalculateUserSalesRequest): Promise<void> {
    if (userIds.length === 0) return
    const sales = await this.saleRepository.findMany({
      clientId: { in: userIds },
    })

    for (const sale of sales) {
      const itemsBuild = this.mapToBuildItems(sale.items)
      const rebuilt = await rebuildSaleItems(itemsBuild, {
        couponId: sale.coupon?.id ?? undefined,
        clientId: sale.clientId,
        planProfileRepository: this.planProfileRepository,
        planRepository: this.planRepository,
        couponRepository: this.couponRepository,
      })

      const total = calculateTotal(rebuilt)

      await prisma.$transaction(async (tx) => {
        for (const item of rebuilt) {
          if (item.id) {
            await updateDiscountsOnSaleItem(
              item,
              item.id,
              this.saleItemRepository,
              tx,
            )
          }
        }
        if (total !== sale.total) {
          await this.saleRepository.update(sale.id, { total }, tx)
        }
      })
    }
  }
}
