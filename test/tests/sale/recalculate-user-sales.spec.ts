import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RecalculateUserSalesService } from '../../../src/modules/sale/application/use-cases/recalculate-user-sales'
import { SaleItemsBuildService } from '../../../src/modules/sale/application/services/sale-items-build-service'
import {
  FakeSaleRepository,
  FakeSaleItemRepository,
  FakePlanRepository,
  FakePlanProfileRepository,
  FakeCouponRepository,
  FakeServiceRepository,
  FakeProductRepository,
  FakeAppointmentRepository,
  FakeBarberUsersRepository,
} from '../../helpers/fake-repositories'
import {
  makeSaleWithBarber,
  makePlan,
  makeService,
  barberUser,
} from '../../helpers/default-values'
import { PlanProfileStatus } from '@prisma/client'
import { prisma } from '../../../src/lib/prisma'
import { calculateRealValueSaleItem } from '../../../src/services/sale/utils/item'

describe('Recalculate user sales service', () => {
  let saleRepo: FakeSaleRepository
  let saleItemRepo: FakeSaleItemRepository
  let planRepo: FakePlanRepository
  let planProfileRepo: FakePlanProfileRepository
  let couponRepo: FakeCouponRepository
  let serviceRepo: FakeServiceRepository
  let productRepo: FakeProductRepository
  let appointmentRepo: FakeAppointmentRepository
  let barberRepo: FakeBarberUsersRepository
  let saleItemsBuildService: SaleItemsBuildService
  let service: RecalculateUserSalesService

  beforeEach(() => {
    saleRepo = new FakeSaleRepository()
    saleItemRepo = new FakeSaleItemRepository(saleRepo)
    planRepo = new FakePlanRepository()
    planProfileRepo = new FakePlanProfileRepository()
    couponRepo = new FakeCouponRepository()
    serviceRepo = new FakeServiceRepository()
    productRepo = new FakeProductRepository()
    appointmentRepo = new FakeAppointmentRepository()
    barberRepo = new FakeBarberUsersRepository()
    ;(barberRepo.users as any).push(barberUser as any)
    saleItemsBuildService = new SaleItemsBuildService({
      serviceRepository: serviceRepo,
      productRepository: productRepo,
      appointmentRepository: appointmentRepo,
      couponRepository: couponRepo,
      barberUserRepository: barberRepo,
      planRepository: planRepo,
      saleRepository: saleRepo,
      planProfileRepository: planProfileRepo,
    })
    service = new RecalculateUserSalesService(
      saleRepo,
      saleItemRepo,
      saleItemsBuildService,
    )
    vi.spyOn(prisma, '$transaction').mockImplementation(async (fn) =>
      fn({} as any),
    )
  })

  it('updates sale totals when plan discounts change', async () => {
    const plan = makePlan('plan1')
    planRepo.plans.push({
      ...plan,
      benefits: [
        {
          id: 'bp1',
          planId: plan.id,
          benefitId: 'b1',
          benefit: {
            id: 'b1',
            name: '',
            description: null,
            discount: 10,
            discountType: 'PERCENTAGE',
            unitId: 'unit-1',
            categories: [{ id: 'bc1', benefitId: 'b1', categoryId: 'cat-1' }],
            services: [],
            products: [],
          },
        },
      ],
    })

    planProfileRepo.items.push({
      id: 'pp1',
      planStartDate: new Date(),
      status: PlanProfileStatus.PAID,
      saleItemId: 'sitem1',
      dueDayDebt: 0,
      planId: plan.id,
      profileId: 'profile-1',
      debts: [],
    })

    const sale = makeSaleWithBarber()
    sale.clientId = 'client-1'
    sale.items[0].id = 'sitem1'
    const svc = makeService('svc1', 100)
    sale.items[0].service = svc
    sale.items[0].serviceId = svc.id
    serviceRepo.services.push(svc)
    sale.items[0].price = 100
    sale.items[0].discounts = [
      {
        amount: 10,
        type: 'VALUE',
        origin: 'PLAN',
        order: 1,
        id: 'disc1',
        saleItemId: 'sitem1',
      },
    ]
    sale.total = 90
    sale.gross_value = 100
    saleRepo.sales.push(sale)

    // update plan benefit discount
    ;(planRepo.plans[0] as any).benefits[0].benefit.discount = 20

    await service.execute({ userIds: ['client-1'] })
    const realPriceItem = calculateRealValueSaleItem(
      saleRepo.sales[0].items[0].price,
      saleRepo.sales[0].items[0].discounts,
    )

    expect(saleRepo.sales[0].items[0].price).toBe(100)
    expect(realPriceItem).toBe(80)
    expect(saleRepo.sales[0].total).toBe(80)
  })
})
