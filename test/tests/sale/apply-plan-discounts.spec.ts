import { it, expect } from 'vitest'
import { applyPlanDiscounts } from '../../../src/services/sale/utils/plan'
import {
  FakePlanRepository,
  FakePlanProfileRepository,
} from '../../helpers/fake-repositories'
import { makePlan, makeService } from '../../helpers/default-values'
import { DiscountType, PaymentStatus, PlanProfileStatus } from '@prisma/client'
import {
  calculateRealValueSaleItem,
  ReturnBuildItemData,
} from '../../../src/services/sale/utils/item'

it('applies plan discount when canceled plan is still valid', async () => {
  const service = makeService('svc1', 100)
  const plan = makePlan('pl1', 100)
  const planRepo = new FakePlanRepository([
    {
      ...plan,
      benefits: [
        {
          id: 'pb1',
          planId: plan.id,
          benefitId: 'b1',
          benefit: {
            id: 'b1',
            name: '',
            description: null,
            discount: 10,
            discountType: DiscountType.VALUE,
            unitId: service.unitId,
            categories: [],
            services: [{ id: 'bs1', benefitId: 'b1', serviceId: service.id }],
            products: [],
          },
        },
      ],
    },
  ])
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const planProfileRepo = new FakePlanProfileRepository([
    {
      id: 'pp1',
      planStartDate: new Date(),
      status: PlanProfileStatus.CANCELED_ACTIVE,
      saleItemId: 'i1',
      dueDayDebt: 1,
      planId: plan.id,
      profileId: 'p1',
      debts: [
        {
          id: 'd1',
          value: 100,
          status: PaymentStatus.PAID,
          planId: plan.id,
          planProfileId: 'pp1',
          paymentDate: tomorrow,
          dueDate: tomorrow,
          createdAt: new Date(),
        },
      ],
    },
  ])
  const items: ReturnBuildItemData[] = [
    {
      price: 100,
      basePrice: 100,
      quantity: 1,
      discounts: [],
      service,
      product: null,
      plan: null,
      barber: null,
      commissionPaid: false,
    },
  ]

  const itemsUp = await applyPlanDiscounts(
    items,
    'u1',
    planProfileRepo,
    planRepo,
    service.unitId,
  )

  const realPrice = calculateRealValueSaleItem(
    itemsUp[0].price,
    itemsUp[0].discounts,
  )
  expect(realPrice).toBe(90)
  expect(items[0].price).toBe(100)
  expect(items[0].discounts[0]).toEqual(
    expect.objectContaining({ origin: 'PLAN' }),
  )
})
