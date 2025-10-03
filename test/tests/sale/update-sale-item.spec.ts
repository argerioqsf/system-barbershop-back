import { describe, it, expect, beforeEach, vi } from 'vitest'
import { UpdateSaleItemDetailsUseCase } from '../../../src/modules/sale/application/use-cases/update-sale-item-details'
import { UpdateSaleItemCouponUseCase } from '../../../src/modules/sale/application/use-cases/update-sale-item-coupon'
import { UpdateSaleItemBarberUseCase } from '../../../src/modules/sale/application/use-cases/update-sale-item-barber'
import { UpdateSaleItemQuantityUseCase } from '../../../src/modules/sale/application/use-cases/update-sale-item-quantity'
import {
  SaleItemUpdateExecutor,
  TransactionRunner,
} from '../../../src/modules/sale/application/services/sale-item-update-executor'
import { SaleTotalsService } from '../../../src/modules/sale/application/services/sale-totals-service'
import { GetItemBuildService } from '../../../src/services/sale/get-item-build'
import { GetItemsBuildService } from '../../../src/services/sale/get-items-build'
import {
  FakeSaleRepository,
  FakeServiceRepository,
  FakeProductRepository,
  FakeAppointmentRepository,
  FakeCouponRepository,
  FakeBarberUsersRepository,
  FakeSaleItemRepository,
  FakePlanRepository,
  FakePlanProfileRepository,
} from '../../helpers/fake-repositories'
import {
  makeSaleWithBarber,
  makeService,
  makeProduct,
  makeCoupon,
  makePlan,
  defaultUnit,
  defaultOrganization,
  defaultUser,
  defaultProfile,
  barberUser,
  barberProfile,
} from '../../helpers/default-values'
import { DiscountOrigin, DiscountType } from '@prisma/client'
import { calculateRealValueSaleItem } from '../../../src/services/sale/utils/item'

let saleRepo: FakeSaleRepository
let serviceRepo: FakeServiceRepository
let productRepo: FakeProductRepository
let appointmentRepo: FakeAppointmentRepository
let couponRepo: FakeCouponRepository
let barberRepo: FakeBarberUsersRepository
let saleItemRepo: FakeSaleItemRepository
let planRepo: FakePlanRepository
let planProfileRepo: FakePlanProfileRepository
let updateDetailsUseCase: UpdateSaleItemDetailsUseCase
let updateCouponUseCase: UpdateSaleItemCouponUseCase
let updateBarberUseCase: UpdateSaleItemBarberUseCase
let updateQuantityUseCase: UpdateSaleItemQuantityUseCase
let runInTransaction: TransactionRunner

beforeEach(() => {
  saleRepo = new FakeSaleRepository()
  serviceRepo = new FakeServiceRepository()
  productRepo = new FakeProductRepository()
  appointmentRepo = new FakeAppointmentRepository()
  couponRepo = new FakeCouponRepository()
  barberRepo = new FakeBarberUsersRepository()
  saleItemRepo = new FakeSaleItemRepository(saleRepo)
  planRepo = new FakePlanRepository()
  planProfileRepo = new FakePlanProfileRepository()
  const sale = makeSaleWithBarber()
  const svc = makeService('svc1', 100)
  sale.items[0].serviceId = svc.id
  sale.items[0].service = svc as any
  sale.gross_value = 100
  saleRepo.sales.push(sale)
  serviceRepo.services.push(svc)
  barberRepo.users.push(
    {
      ...defaultUser,
      id: 'cashier',
      organizationId: defaultOrganization.id,
      unitId: defaultUnit.id,
      unit: { ...defaultUnit, organizationId: defaultOrganization.id },
      profile: defaultProfile,
    },
    {
      ...barberUser,
      profile: {
        ...barberProfile,
        permissions: [
          ...barberProfile.permissions,
          { id: 'perm-prod', name: 'SELL_PRODUCT' },
        ],
      },
    },
  )
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

  const saleTotalsService = new SaleTotalsService(saleRepo, couponRepo, {
    createGetItemBuildService: () => getItemBuildService,
    createGetItemsBuildService: () => getItemsBuildService,
  })

  runInTransaction = async (fn) =>
    fn({
      discount: { deleteMany: vi.fn() },
      planProfile: { deleteMany: vi.fn() },
    } as any)

  const executor = new SaleItemUpdateExecutor({
    saleItemRepository: saleItemRepo,
    saleRepository: saleRepo,
    saleTotalsService,
    runInTransaction,
  })

  updateDetailsUseCase = new UpdateSaleItemDetailsUseCase(executor, productRepo)

  updateCouponUseCase = new UpdateSaleItemCouponUseCase(executor, couponRepo)

  updateBarberUseCase = new UpdateSaleItemBarberUseCase(executor)

  updateQuantityUseCase = new UpdateSaleItemQuantityUseCase(
    executor,
    productRepo,
  )
})

describe('Update sale item service', () => {
  it('updates quantity and total', async () => {
    const result = await updateQuantityUseCase.execute({
      saleItemId: 'i1',
      quantity: 2,
    })

    expect(result.sale?.total).toBe(200)
    expect(saleRepo.sales[0].total).toBe(200)
  })

  it('updates gross total when quantity change keeps net total stable', async () => {
    saleRepo.sales[0].items[0].customPrice = 50
    saleRepo.sales[0].items[0].price = 100
    saleRepo.sales[0].items[0].discounts = [
      {
        id: 'd-custom-price',
        saleItemId: 'i1',
        amount: 50,
        type: DiscountType.VALUE,
        origin: DiscountOrigin.VALUE_SALE_ITEM,
        order: 1,
      },
    ]
    saleRepo.sales[0].total = 50
    saleRepo.sales[0].gross_value = 100

    const result = await updateQuantityUseCase.execute({
      saleItemId: 'i1',
      quantity: 2,
    })

    expect(result.sale?.total).toBe(50)
    expect(result.sale?.gross_value).toBe(200)
    expect(saleRepo.sales[0].gross_value).toBe(200)
  })

  it('changes service item to product and updates stock', async () => {
    const prod = makeProduct('p1', 50, 5)
    productRepo.products.push(prod)

    const result = await updateDetailsUseCase.execute({
      saleItemId: 'i1',
      productId: prod.id,
      serviceId: null,
    })

    expect(result.sale?.total).toBe(50)
    expect(productRepo.products[0].quantity).toBe(4)
  })

  it('applies coupon discount', async () => {
    const coupon = makeCoupon('c1', 'OFF', 10, 'VALUE')
    couponRepo.coupons.push(coupon)

    const result = await updateCouponUseCase.execute({
      saleItemId: 'i1',
      couponId: coupon.id,
    })

    const item = result.saleItems![0]
    expect(item.discounts[0]).toEqual(
      expect.objectContaining({ origin: DiscountOrigin.COUPON_SALE_ITEM }),
    )
    expect(item.price).toBe(100)
    const realPriceItem = calculateRealValueSaleItem(item.price, item.discounts)
    expect(realPriceItem).toBe(90)
    expect(result.sale?.total).toBe(90)
  })

  it('removes coupon from item', async () => {
    const coupon = makeCoupon('c2', 'OFF10', 10, 'VALUE')
    couponRepo.coupons.push(coupon)
    saleRepo.sales[0].items[0].couponId = coupon.id
    saleRepo.sales[0].items[0].coupon = coupon as any
    saleRepo.sales[0].items[0].price = 90
    saleRepo.sales[0].total = 90
    saleRepo.sales[0].items[0].discounts = [
      {
        amount: 10,
        type: DiscountType.VALUE,
        origin: DiscountOrigin.COUPON_SALE_ITEM,
        order: 1,
        id: 'd1',
        saleItemId: 'i1',
      },
    ]

    const result = await updateCouponUseCase.execute({
      saleItemId: 'i1',
      couponId: null,
    })

    const item = result.saleItems![0]
    expect(item.discounts).toHaveLength(0)
    expect(item.price).toBe(100)
    expect(result.sale?.total).toBe(100)
  })

  it('applies plan discount when client has plan', async () => {
    const plan = makePlan('pl1', 100)
    planRepo.plans.push({
      ...plan,
      benefits: [
        {
          id: 'pb1',
          planId: plan.id,
          benefitId: 'b1',
          benefit: {
            id: 'b1',
            name: 'B',
            description: null,
            discount: 10,
            discountType: DiscountType.VALUE,
            unitId: defaultUnit.id,
            categories: [],
            services: [{ id: 'bs1', benefitId: 'b1', serviceId: 'svc1' }],
            products: [],
            plans: [],
          },
        },
      ],
    })
    planProfileRepo.items.push({
      id: 'pp1',
      planStartDate: new Date(),
      status: 'PAID',
      saleItemId: 'i1',
      dueDayDebt: 1,
      planId: plan.id,
      profileId: 'p-c1',
      debts: [],
    })

    const result = await updateQuantityUseCase.execute({
      saleItemId: 'i1',
      quantity: 2,
    })

    const item = result.saleItems![0]
    const realPriceItem = calculateRealValueSaleItem(item.price, item.discounts)
    expect(item.discounts[0]).toEqual(
      expect.objectContaining({ origin: DiscountOrigin.PLAN }),
    )
    expect(realPriceItem).toBe(190)
    expect(result.sale?.total).toBe(200)
  })

  it('restores stock when changing from product to service', async () => {
    const prod = makeProduct('p2', 40, 4)
    const svc2 = makeService('svc2', 80)
    saleRepo.sales[0].items[0].serviceId = null
    saleRepo.sales[0].items[0].service = null as any
    saleRepo.sales[0].items[0].productId = prod.id
    saleRepo.sales[0].items[0].product = prod as any
    saleRepo.sales[0].items[0].price = 40
    saleRepo.sales[0].total = 40
    productRepo.products.push(prod)
    serviceRepo.services.push(svc2)

    const result = await updateDetailsUseCase.execute({
      saleItemId: 'i1',
      serviceId: svc2.id,
      productId: null,
    })

    expect(productRepo.products[0].quantity).toBe(5)
    expect(result.sale?.total).toBe(80)
  })

  it('throws when id is missing', async () => {
    await expect(
      updateQuantityUseCase.execute({ saleItemId: '', quantity: 1 }),
    ).rejects.toThrow('Sale item identifier is required')
  })

  it('throws when sale item not found', async () => {
    await expect(
      updateQuantityUseCase.execute({ saleItemId: 'invalid', quantity: 1 }),
    ).rejects.toThrow('Sale Item not found')
  })

  it('throws when commission already paid', async () => {
    saleRepo.sales[0].items[0].commissionPaid = true
    await expect(
      updateQuantityUseCase.execute({ saleItemId: 'i1', quantity: 1 }),
    ).rejects.toThrow('Cannot edit a paid sale item')
  })

  it('throws when sale is paid', async () => {
    saleRepo.sales[0].paymentStatus = 'PAID'
    await expect(
      updateQuantityUseCase.execute({ saleItemId: 'i1', quantity: 1 }),
    ).rejects.toThrow('Cannot edit a paid sale')
  })

  it('throws when sale not found during update', async () => {
    const spy = vi
      .spyOn(saleRepo, 'findById')
      .mockResolvedValueOnce(null as any)
    await expect(
      updateQuantityUseCase.execute({ saleItemId: 'i1', quantity: 2 }),
    ).rejects.toThrow('Sale not found')
    spy.mockRestore()
  })
})
