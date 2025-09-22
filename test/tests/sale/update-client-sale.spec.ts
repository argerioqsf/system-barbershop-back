import { describe, it, expect, beforeEach, vi } from 'vitest'
import { UpdateSaleClientUseCase } from '../../../src/modules/sale/application/use-cases/update-sale-client'
import {
  FakeSaleRepository,
  FakeProfilesRepository,
  FakeSaleItemRepository,
  FakePlanRepository,
  FakePlanProfileRepository,
  FakeServiceRepository,
  FakeProductRepository,
  FakeAppointmentRepository,
  FakeCouponRepository,
  FakeBarberUsersRepository,
} from '../../helpers/fake-repositories'
import {
  makeSale,
  makeProfile,
  makeService,
  defaultClient,
} from '../../helpers/default-values'
import { DiscountOrigin, DiscountType, type Service } from '@prisma/client'
import { GetItemBuildService } from '../../../src/services/sale/get-item-build'
import { GetItemsBuildService } from '../../../src/services/sale/get-items-build'
import { TransactionRunner } from '../../../src/modules/sale/application/services/sale-item-update-executor'
import { calculateRealValueSaleItem } from '../../../src/services/sale/utils/item'
import { PlanWithBenefits } from '../../../src/repositories/plan-repository'

let saleRepo: FakeSaleRepository
let profileRepo: FakeProfilesRepository
let saleItemRepo: FakeSaleItemRepository
let planRepo: FakePlanRepository
let planProfileRepo: FakePlanProfileRepository
let serviceRepo: FakeServiceRepository
let productRepo: FakeProductRepository
let appointmentRepo: FakeAppointmentRepository
let couponRepo: FakeCouponRepository
let barberRepo: FakeBarberUsersRepository
let service: UpdateSaleClientUseCase
let svc: Service
let runInTransaction: TransactionRunner

beforeEach(() => {
  saleRepo = new FakeSaleRepository()
  profileRepo = new FakeProfilesRepository()
  saleItemRepo = new FakeSaleItemRepository(saleRepo)
  planRepo = new FakePlanRepository()
  planProfileRepo = new FakePlanProfileRepository()
  serviceRepo = new FakeServiceRepository()
  productRepo = new FakeProductRepository()
  appointmentRepo = new FakeAppointmentRepository()
  couponRepo = new FakeCouponRepository()
  barberRepo = new FakeBarberUsersRepository()
  saleRepo.sales.push(makeSale('sale-1'))
  svc = makeService('svc1', 100)
  serviceRepo.services.push(svc)
  saleRepo.sales[0].items.push({
    id: 'i1',
    saleId: 'sale-1',
    serviceId: svc.id,
    productId: null,
    planId: null,
    quantity: 1,
    barberId: null,
    couponId: null,
    price: 100,
    customPrice: null,
    discounts: [],
    porcentagemBarbeiro: 0,
    service: svc,
    product: null,
    plan: null,
    barber: null,
    coupon: null,
    appointmentId: null,
    appointment: null,
    commissionPaid: false,
  })
  const newClient = { ...defaultClient, id: 'c2' }
  profileRepo.profiles = [{ ...makeProfile('p-c2', 'c2'), user: newClient }]
  const getItemBuildService = new GetItemBuildService(
    serviceRepo,
    productRepo,
    appointmentRepo,
    couponRepo,
    barberRepo,
    planRepo,
    saleRepo,
    planProfileRepo,
  )

  const getItemsBuildService = new GetItemsBuildService(getItemBuildService)

  runInTransaction = async (fn) =>
    fn({
      discount: { deleteMany: vi.fn() },
      planProfile: { deleteMany: vi.fn() },
    } as any)

  service = new UpdateSaleClientUseCase(
    saleRepo,
    profileRepo,
    saleItemRepo,
    planRepo,
    planProfileRepo,
    getItemsBuildService,
    runInTransaction,
  )
})

describe('Update client sale service', () => {
  it('updates client of sale', async () => {
    const result = await service.execute({ id: 'sale-1', clientId: 'c2' })

    expect(result.sale?.clientId).toBe('c2')
    expect(saleRepo.sales[0].clientId).toBe('c2')
  })

  it('applies plan discount when new client has plan', async () => {
    const plan: PlanWithBenefits = {
      id: 'pl1',
      price: 100,
      name: 'Plan',
      typeRecurrenceId: 'rec1',
      benefits: [
        {
          id: 'bp1',
          planId: 'pl1',
          benefitId: 'b1',
          benefit: {
            id: 'b1',
            name: 'B',
            description: null,
            discount: 10,
            discountType: DiscountType.VALUE,
            unitId: defaultClient.unitId,
            categories: [],
            services: [{ id: 'bs1', benefitId: 'b1', serviceId: svc.id }],
            products: [],
          },
        },
      ],
    }
    planRepo.plans.push(plan)
    planProfileRepo.items.push({
      id: 'pp1',
      planStartDate: new Date(),
      status: 'PAID',
      saleItemId: 'i1',
      dueDayDebt: 1,
      planId: plan.id,
      profileId: 'p-c2',
      debts: [],
    })

    const result = await service.execute({ id: 'sale-1', clientId: 'c2' })

    const item = result.sale!.items[0]
    const realPriceItem = calculateRealValueSaleItem(item.price, item.discounts)
    expect(item.discounts[0]).toEqual(
      expect.objectContaining({ origin: DiscountOrigin.PLAN }),
    )
    expect(realPriceItem).toBe(90)
    expect(item.price).toBe(100)
  })

  it('removes plan discounts when changing to client without plan', async () => {
    saleRepo.sales[0].items[0].price = 100
    saleRepo.sales[0].items[0].discounts = [
      {
        amount: 10,
        type: DiscountType.VALUE,
        origin: DiscountOrigin.PLAN,
        order: 1,
        id: 'd1',
        saleItemId: 'i1',
      },
    ]

    const result = await service.execute({ id: 'sale-1', clientId: 'c2' })

    expect(result.sale!.items[0].discounts).toHaveLength(0)
    expect(result.sale!.items[0].price).toBe(100)
  })

  it('throws when no changes', async () => {
    await expect(
      service.execute({ id: 'sale-1', clientId: 'client-1' }),
    ).rejects.toThrow('No changes to the client')
  })
  it('throws when id is missing', async () => {
    await expect(service.execute({ id: '', clientId: 'c2' })).rejects.toThrow(
      'Sale ID is required',
    )
  })

  it('throws when sale not found', async () => {
    await expect(
      service.execute({ id: 'unknown', clientId: 'c2' }),
    ).rejects.toThrow('Sale not found')
  })

  it('throws when sale is paid', async () => {
    saleRepo.sales[0].paymentStatus = 'PAID'
    await expect(
      service.execute({ id: 'sale-1', clientId: 'c2' }),
    ).rejects.toThrow('Cannot edit a paid sale')
  })

  it('throws when profile not found', async () => {
    profileRepo.profiles = []
    await expect(
      service.execute({ id: 'sale-1', clientId: 'c2' }),
    ).rejects.toThrow('Profile not found')
  })
})
