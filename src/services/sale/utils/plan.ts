import {
  DiscountType,
  PlanProfileStatus,
  DiscountOrigin,
  PaymentStatus,
} from '@prisma/client'
import {
  PlanRepository,
  PlanWithBenefits,
} from '@/repositories/plan-repository'
import { PlanProfileRepository } from '@/repositories/plan-profile-repository'
import { ReturnBuildItemData } from './item'

function applyBenefitOnItem(
  item: ReturnBuildItemData,
  benefit: PlanWithBenefits['benefits'][number]['benefit'],
) {
  if (!item.service && !item.product) return item

  const serviceId = item.service?.id
  const productId = item.product?.id
  const categoryId = item.service
    ? item.service.categoryId
    : item.product?.categoryId

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

  return item
}

export async function applyPlanDiscounts(
  saleItems: ReturnBuildItemData[],
  userId: string,
  planProfileRepo: PlanProfileRepository,
  planRepo: PlanRepository,
): Promise<ReturnBuildItemData[]> {
  const profilePlans = await planProfileRepo.findMany({
    profile: { userId },
    status: { in: [PlanProfileStatus.PAID, PlanProfileStatus.CANCELED] },
  })
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const validProfiles = profilePlans.filter((pp) => {
    if (pp.status !== PlanProfileStatus.CANCELED) return true
    if (pp.debts.length === 0) return false
    const lastPaid = [...pp.debts]
      .filter((d) => d.status === PaymentStatus.PAID)
      .sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime())[0]
    if (!lastPaid) return false
    return today.getTime() <= lastPaid.paymentDate.getTime()
  })
  const benefitsMap: Record<
    string,
    PlanWithBenefits['benefits'][number]['benefit']
  > = {}
  for (const pp of validProfiles) {
    const plan = await planRepo.findByIdWithBenefits(pp.planId)
    if (!plan) continue
    for (const pb of plan.benefits) {
      benefitsMap[pb.benefit.id] = pb.benefit
    }
  }
  const benefits = Object.values(benefitsMap)

  for (const item of saleItems) {
    if (item.price <= 0) continue
    for (const benefit of benefits) {
      applyBenefitOnItem(item, benefit)
    }
  }

  return saleItems
}
