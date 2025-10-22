import { PlanRepository } from '@/repositories/plan-repository'
import { PlanProfileRepository } from '@/repositories/plan-profile-repository'
import { ReturnBuildItemData } from '@/modules/sale/application/dto/sale-item-dto'
import { PlanDiscountService } from '@/modules/sale/application/services/plan-discount-service'

export async function applyPlanDiscounts(
  saleItems: ReturnBuildItemData[],
  clientId: string,
  planProfileRepo: PlanProfileRepository,
  planRepo: PlanRepository,
  unitId?: string,
): Promise<ReturnBuildItemData[]> {
  const planDiscountService = new PlanDiscountService({
    planRepository: planRepo,
    planProfileRepository: planProfileRepo,
  })
  return planDiscountService.apply(saleItems, clientId, unitId)
}
