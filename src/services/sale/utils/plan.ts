import { DiscountType, PlanProfileStatus } from '@prisma/client'
import {
  PlanRepository,
  PlanWithBenefits,
} from '@/repositories/plan-repository'
import { PlanProfileRepository } from '@/repositories/plan-profile-repository'
import { TempItems, DiscountOrigin } from '../types'

function applyBenefitOnItem(
  item: TempItems,
  benefit: PlanWithBenefits['benefits'][number]['benefit'],
) {
  const serviceId = item.data.service?.connect?.id
  const productId = item.data.product?.connect?.id
  const categoryId = item.data.categoryId
  const matchCategory = benefit.categories.some(
    (c) => c.categoryId === categoryId,
  )
  const matchService =
    serviceId && benefit.services.some((s) => s.serviceId === serviceId)
  const matchProduct =
    productId && benefit.products.some((p) => p.productId === productId)
  if (!matchCategory && !matchService && !matchProduct) return
  if (item.price <= 0) return

  const discount = benefit.discount ?? 0
  let valueDiscount = 0
  if (benefit.discountType === DiscountType.PERCENTAGE) {
    valueDiscount = (item.price * discount) / 100
  } else if (benefit.discountType === DiscountType.VALUE) {
    valueDiscount = discount
  }
  if (valueDiscount <= 0) return
  if (item.price - valueDiscount < 0) {
    valueDiscount = item.price
    item.price = 0
  } else {
    item.price -= valueDiscount
  }
  item.discounts.push({
    amount:
      benefit.discountType === DiscountType.PERCENTAGE
        ? benefit.discount ?? 0
        : valueDiscount,
    type: (benefit.discountType ?? DiscountType.VALUE) as DiscountType,
    origin: DiscountOrigin.PLAN,
    order: item.discounts.length + 1,
  })
}

export async function applyPlanDiscounts(
  items: TempItems[],
  profileId: string,
  planProfileRepo: PlanProfileRepository,
  planRepo: PlanRepository,
): Promise<void> {
  const planProfiles = await planProfileRepo.findMany({
    profileId,
    status: PlanProfileStatus.PAID,
  })
  const benefitsMap: Record<
    string,
    PlanWithBenefits['benefits'][number]['benefit']
  > = {}
  for (const pp of planProfiles) {
    const plan = await planRepo.findByIdWithBenefits(pp.planId)
    if (!plan) continue
    for (const pb of plan.benefits) {
      benefitsMap[pb.benefit.id] = pb.benefit
    }
  }
  const benefits = Object.values(benefitsMap)
  for (const benefit of benefits) {
    for (const item of items) {
      if (item.price <= 0) continue
      applyBenefitOnItem(item, benefit)
    }
  }
}
