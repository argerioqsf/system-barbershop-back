import { PlanProfileStatus } from '@prisma/client'

import { PlanRepository } from '@/modules/sale/application/ports/plan-repository'
import { PlanProfileRepository } from '@/modules/sale/application/ports/plan-profile-repository'
import { ReturnBuildItemData } from '@/modules/sale/application/dto/sale-item-dto'
import {
  PlanBenefit,
  PlanBenefitApplier,
} from '@/modules/sale/domain/services/plan-benefit-applier'

export interface PlanDiscountServiceDeps {
  planRepository: PlanRepository
  planProfileRepository: PlanProfileRepository
}

export class PlanDiscountService {
  constructor(private readonly deps: PlanDiscountServiceDeps) {}

  async apply(
    saleItems: ReturnBuildItemData[],
    clientId: string,
    unitId?: string,
  ): Promise<ReturnBuildItemData[]> {
    if (saleItems.length === 0) return saleItems

    const benefits = await this.loadApplicableBenefits(clientId, unitId)
    if (benefits.length === 0) return saleItems

    const updatedItems = PlanBenefitApplier.applyBenefitsToItems(
      saleItems.map((item) => ({
        service: item.service
          ? { id: item.service.id, categoryId: item.service.categoryId }
          : null,
        product: item.product
          ? { id: item.product.id, categoryId: item.product.categoryId }
          : null,
        quantity: item.quantity,
        price: item.price,
        basePrice: item.basePrice,
        customPrice: item.customPrice ?? null,
        discounts: item.discounts,
      })),
      benefits,
    )

    updatedItems.forEach((updated, index) => {
      saleItems[index].discounts = updated.discounts
    })

    return saleItems
  }

  private async loadApplicableBenefits(
    clientId: string,
    unitId?: string,
  ): Promise<PlanBenefit[]> {
    const profiles = await this.deps.planProfileRepository.findMany({
      profile: { userId: clientId },
      plan: { unitId },
      status: {
        in: [PlanProfileStatus.PAID, PlanProfileStatus.CANCELED_ACTIVE],
      },
    })

    const benefitMap = new Map<string, PlanBenefit>()

    for (const profile of profiles) {
      const plan = await this.deps.planRepository.findByIdWithBenefits(
        profile.planId,
      )
      if (!plan) continue

      for (const benefitEdge of plan.benefits) {
        const benefit = benefitEdge.benefit
        benefitMap.set(benefit.id, {
          id: benefit.id,
          discount: benefit.discount,
          discountType: benefit.discountType,
          categories: benefit.categories,
          services: benefit.services,
          products: benefit.products,
        })
      }
    }

    return Array.from(benefitMap.values())
  }
}
