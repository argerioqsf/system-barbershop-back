import { DiscountType, PlanProfileStatus } from '@prisma/client'
import {
  PlanRepository,
  PlanWithBenefits,
} from '@/repositories/plan-repository'
import { PlanProfileRepository } from '@/repositories/plan-profile-repository'
import { TempItems } from '../types'

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

  // TODO: adicionar um if para verificar se o item.price ja é zero
  // se for nao aplicar mais descontos
  const discount = benefit.discount ?? 0
  // TODO: trocar o nome da variavel value para valueDiscount
  let value = 0
  if (benefit.discountType === DiscountType.PERCENTAGE) {
    value = (item.price * discount) / 100
  } else if (benefit.discountType === DiscountType.VALUE) {
    value = discount
  }
  if (value <= 0) return
  if (item.price - value < 0) {
    item.discount += item.price
    item.price = 0
  } else {
    item.price -= value
    item.discount += value
  }
}

export async function applyPlanDiscounts(
  items: TempItems[],
  profileId: string,
  planProfileRepo: PlanProfileRepository,
  planRepo: PlanRepository,
): Promise<void> {
  // TODO: troca o nome da variavel profiles a baixo para planProfiles
  const profiles = await planProfileRepo.findMany({
    profileId,
    status: PlanProfileStatus.PAID,
  })
  const benefitsMap: Record<
    string,
    PlanWithBenefits['benefits'][number]['benefit']
  > = {}
  for (const pp of profiles) {
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
