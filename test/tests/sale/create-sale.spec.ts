import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  PaymentMethod,
  DiscountType,
  PaymentStatus,
  CommissionCalcType,
  PermissionName,
  PermissionCategory,
  Profile,
  Permission,
  ProfileWorkHour,
  ProfileBlockedHour,
  BarberService,
  Role,
} from '@prisma/client'
import { CreateSaleService } from '../../../src/services/sale/create-sale'
import { CreateTransactionService } from '../../../src/services/transaction/create-transaction'
import {
  FakeServiceRepository,
  FakeProductRepository,
  FakeCouponRepository,
  FakeSaleRepository,
  FakeBarberUsersRepository,
  FakeBarberServiceRelRepository,
  FakeBarberProductRepository,
  FakeCashRegisterRepository,
  FakeTransactionRepository,
  FakeOrganizationRepository,
  FakeProfilesRepository,
  FakeUnitRepository,
  FakeAppointmentRepository,
} from '../../helpers/fake-repositories'

import {
  defaultUser,
  defaultClient,
  barberProfile,
  barberUser,
  makeService,
  makeProduct,
  makeCoupon,
  makeBarberServiceRel,
  makeBarberProductRel,
  defaultOrganization,
  defaultUnit,
} from '../../helpers/default-values'

let transactionRepo: FakeTransactionRepository
let barberRepo: FakeBarberUsersRepository
let cashRepo: FakeCashRegisterRepository

vi.mock(
  '../../../src/services/@factories/transaction/make-create-transaction',
  () => ({
    makeCreateTransaction: () =>
      new CreateTransactionService(transactionRepo, barberRepo, cashRepo),
  }),
)

function setup() {
  const serviceRepo = new FakeServiceRepository()
  const productRepo = new FakeProductRepository()
  const couponRepo = new FakeCouponRepository()
  const saleRepo = new FakeSaleRepository()
  barberRepo = new FakeBarberUsersRepository()
  const barberServiceRepo = new FakeBarberServiceRelRepository()
  const barberProductRepo = new FakeBarberProductRepository()
  cashRepo = new FakeCashRegisterRepository()
  transactionRepo = new FakeTransactionRepository()
  const appointmentRepo = new FakeAppointmentRepository()
  const organizationRepo = new FakeOrganizationRepository({
    ...defaultOrganization,
  })
  const profilesRepo = new FakeProfilesRepository()
  const unit = { ...defaultUnit }
  const unitRepo = new FakeUnitRepository(unit)

  const createSale = new CreateSaleService(
    saleRepo,
    serviceRepo,
    productRepo,
    couponRepo,
    barberRepo,
    barberServiceRepo,
    barberProductRepo,
    cashRepo,
    transactionRepo,
    organizationRepo,
    profilesRepo,
    unitRepo,
    appointmentRepo,
  )

  return {
    serviceRepo,
    productRepo,
    couponRepo,
    saleRepo,
    barberRepo,
    barberServiceRepo,
    barberProductRepo,
    cashRepo,
    transactionRepo,
    organizationRepo,
    profilesRepo,
    unitRepo,
    appointmentRepo,
    createSale,
  }
}

describe('Create sale service', () => {
  let ctx: ReturnType<typeof setup>
  beforeEach(() => {
    ctx = setup()
    const profile: Profile & {
      permissions: Permission[]
      workHours: ProfileWorkHour[]
      blockedHours: ProfileBlockedHour[]
      barberServices: BarberService[]
      role: Role
    } = {
      id: 'profile-user',
      phone: '',
      cpf: '',
      genre: '',
      birthday: '',
      pix: '',
      roleId: 'role-1',
      commissionPercentage: 0,
      totalBalance: 0,
      userId: defaultUser.id,
      createdAt: new Date(),
      permissions: [
        {
          id: 'perm-sale',
          name: PermissionName.CREATE_SALE,
          category: PermissionCategory.SALE,
        },
      ],
      role: { id: 'role-1', name: 'ADMIN', unitId: 'unit-1' },
      workHours: [],
      blockedHours: [],
      barberServices: [],
    }
    ctx.barberRepo.users.push(
      { ...defaultUser, profile },
      defaultClient,
      barberUser,
    )
  })

  it('creates a sale with one service item without coupon', async () => {
    const service = makeService('service-1', 100)
    ctx.serviceRepo.services.push(service)

    const result = await ctx.createSale.execute({
      userId: defaultUser.id,
      method: PaymentMethod.CASH,
      items: [{ serviceId: service.id, quantity: 1 }],
      clientId: defaultClient.id,
      paymentStatus: PaymentStatus.PENDING,
    })

    expect(result.sale.total).toBe(100)
    expect(result.sale.items).toHaveLength(1)
    expect(result.sale.items[0].price).toBe(100)
    expect(result.sale.items[0].discount).toBe(0)
    expect(result.sale.items[0].discountType).toBeNull()
  })

  it('creates a sale with one service item with value coupon on item', async () => {
    const service = makeService('service-1', 100)
    const coupon = makeCoupon('c1', 'VAL10', 10, DiscountType.VALUE)
    ctx.serviceRepo.services.push(service)
    ctx.couponRepo.coupons.push(coupon)

    const result = await ctx.createSale.execute({
      userId: defaultUser.id,
      method: PaymentMethod.CASH,
      items: [{ serviceId: service.id, quantity: 1, couponCode: coupon.code }],
      clientId: defaultClient.id,
      paymentStatus: PaymentStatus.PENDING,
    })

    expect(result.sale.total).toBe(90)
    expect(result.sale.items[0].price).toBe(90)
    expect(result.sale.items[0].discount).toBe(10)
    expect(result.sale.items[0].discountType).toBe(DiscountType.VALUE)
    expect(ctx.couponRepo.coupons[0].quantity).toBe(4)
  })

  it('creates a sale with one service item with percentage coupon on item', async () => {
    const service = makeService('service-2', 100)
    const coupon = makeCoupon('c2', 'PERC10', 10, DiscountType.PERCENTAGE)
    ctx.serviceRepo.services.push(service)
    ctx.couponRepo.coupons.push(coupon)

    const result = await ctx.createSale.execute({
      userId: defaultUser.id,
      method: PaymentMethod.CASH,
      items: [{ serviceId: service.id, quantity: 1, couponCode: coupon.code }],
      clientId: defaultClient.id,
    })

    expect(result.sale.total).toBe(90)
    expect(result.sale.items[0].discount).toBe(10)
    expect(result.sale.items[0].discountType).toBe(DiscountType.PERCENTAGE)
  })

  it('creates a sale with one service item and general value coupon', async () => {
    const service = makeService('service-3', 100)
    const coupon = makeCoupon('c3', 'VAL20', 20, DiscountType.VALUE)
    ctx.serviceRepo.services.push(service)
    ctx.couponRepo.coupons.push(coupon)

    const result = await ctx.createSale.execute({
      userId: defaultUser.id,
      method: PaymentMethod.CASH,
      items: [{ serviceId: service.id, quantity: 1 }],
      clientId: defaultClient.id,
      couponCode: coupon.code,
    })

    expect(result.sale.total).toBe(80)
    expect(result.sale.items[0].price).toBe(80)
    expect(result.sale.items[0].discountType).toBe(DiscountType.VALUE)
  })

  it('creates a sale with one service item and general percentage coupon', async () => {
    const service = makeService('service-4', 100)
    const coupon = makeCoupon('c4', 'P20', 20, DiscountType.PERCENTAGE)
    ctx.serviceRepo.services.push(service)
    ctx.couponRepo.coupons.push(coupon)

    const result = await ctx.createSale.execute({
      userId: defaultUser.id,
      method: PaymentMethod.CASH,
      items: [{ serviceId: service.id, quantity: 1 }],
      clientId: defaultClient.id,
      couponCode: coupon.code,
    })

    expect(result.sale.total).toBe(80)
    expect(result.sale.items[0].discount).toBe(20)
    expect(result.sale.items[0].discountType).toBe(DiscountType.PERCENTAGE)
  })

  it('creates a sale with one product item without coupon', async () => {
    const product = makeProduct('product-1', 50)
    ctx.productRepo.products.push(product)

    const result = await ctx.createSale.execute({
      userId: defaultUser.id,
      method: PaymentMethod.CASH,
      items: [{ productId: product.id, quantity: 2 }],
      clientId: defaultClient.id,
    })

    expect(result.sale.total).toBe(100)
    expect(product.quantity).toBe(3)
  })

  it('creates a sale with one product item with value coupon on item', async () => {
    const product = makeProduct('product-2', 50)
    const coupon = makeCoupon('pc1', 'PV10', 10, DiscountType.VALUE)
    ctx.productRepo.products.push(product)
    ctx.couponRepo.coupons.push(coupon)

    const result = await ctx.createSale.execute({
      userId: defaultUser.id,
      method: PaymentMethod.CASH,
      items: [{ productId: product.id, quantity: 2, couponCode: coupon.code }],
      clientId: defaultClient.id,
    })

    expect(result.sale.total).toBe(90)
    expect(result.sale.items[0].discount).toBe(10)
    expect(result.sale.items[0].discountType).toBe(DiscountType.VALUE)
    expect(product.quantity).toBe(3)
  })

  it('creates a sale with one product item with percentage coupon on item', async () => {
    const product = makeProduct('product-3', 50)
    const coupon = makeCoupon('pc2', 'PP10', 10, DiscountType.PERCENTAGE)
    ctx.productRepo.products.push(product)
    ctx.couponRepo.coupons.push(coupon)

    const result = await ctx.createSale.execute({
      userId: defaultUser.id,
      method: PaymentMethod.CASH,
      items: [{ productId: product.id, quantity: 2, couponCode: coupon.code }],
      clientId: defaultClient.id,
    })

    expect(result.sale.total).toBe(90)
    expect(result.sale.items[0].discount).toBe(10)
    expect(result.sale.items[0].discountType).toBe(DiscountType.PERCENTAGE)
    expect(product.quantity).toBe(3)
  })

  it('creates a sale with one product item and general value coupon', async () => {
    const product = makeProduct('product-4', 50)
    const coupon = makeCoupon('pc3', 'GV30', 30, DiscountType.VALUE)
    ctx.productRepo.products.push(product)
    ctx.couponRepo.coupons.push(coupon)

    const result = await ctx.createSale.execute({
      userId: defaultUser.id,
      method: PaymentMethod.CASH,
      items: [{ productId: product.id, quantity: 1 }],
      clientId: defaultClient.id,
      couponCode: coupon.code,
    })

    expect(result.sale.total).toBe(20)
    expect(result.sale.items[0].price).toBe(20)
    expect(result.sale.items[0].discountType).toBe(DiscountType.VALUE)
    expect(product.quantity).toBe(4)
  })

  it('creates a sale with one product item and general percentage coupon', async () => {
    const product = makeProduct('product-5', 50)
    const coupon = makeCoupon('pc4', 'GP50', 50, DiscountType.PERCENTAGE)
    ctx.productRepo.products.push(product)
    ctx.couponRepo.coupons.push(coupon)

    const result = await ctx.createSale.execute({
      userId: defaultUser.id,
      method: PaymentMethod.CASH,
      items: [{ productId: product.id, quantity: 1 }],
      clientId: defaultClient.id,
      couponCode: coupon.code,
    })

    expect(result.sale.total).toBe(25)
    expect(result.sale.items[0].discount).toBe(50)
    expect(result.sale.items[0].discountType).toBe(DiscountType.PERCENTAGE)
    expect(product.quantity).toBe(4)
  })

  it('creates a sale with product and service items without coupons', async () => {
    const service = makeService('service-5', 100)
    const product = makeProduct('product-6', 50)
    ctx.serviceRepo.services.push(service)
    ctx.productRepo.products.push(product)

    const result = await ctx.createSale.execute({
      userId: defaultUser.id,
      method: PaymentMethod.CASH,
      items: [
        { serviceId: service.id, quantity: 1 },
        { productId: product.id, quantity: 1 },
      ],
      clientId: defaultClient.id,
    })

    expect(result.sale.total).toBe(150)
    expect(product.quantity).toBe(4)
    expect(result.sale.items).toHaveLength(2)
  })

  it('creates a sale with product and service items with coupons on each item (value)', async () => {
    const service = makeService('service-6', 100)
    const product = makeProduct('product-7', 50)
    const couponService = makeCoupon('cs5', 'SV5', 5, DiscountType.VALUE)
    const couponProduct = makeCoupon('cp5', 'PV5', 5, DiscountType.VALUE)
    ctx.serviceRepo.services.push(service)
    ctx.productRepo.products.push(product)
    ctx.couponRepo.coupons.push(couponService, couponProduct)

    const result = await ctx.createSale.execute({
      userId: defaultUser.id,
      method: PaymentMethod.CASH,
      items: [
        { serviceId: service.id, quantity: 1, couponCode: couponService.code },
        { productId: product.id, quantity: 1, couponCode: couponProduct.code },
      ],
      clientId: defaultClient.id,
    })

    expect(result.sale.total).toBe(140)
    expect(result.sale.items[0].price).toBe(95)
    expect(result.sale.items[1].price).toBe(45)
    expect(product.quantity).toBe(4)
  })

  it('creates a sale with product and service items with coupons on each item (percentage)', async () => {
    const service = makeService('service-7', 100)
    const product = makeProduct('product-8', 50)
    const couponService = makeCoupon(
      'cs6',
      'SV10P',
      10,
      DiscountType.PERCENTAGE,
    )
    const couponProduct = makeCoupon(
      'cp6',
      'PV10P',
      10,
      DiscountType.PERCENTAGE,
    )
    ctx.serviceRepo.services.push(service)
    ctx.productRepo.products.push(product)
    ctx.couponRepo.coupons.push(couponService, couponProduct)

    const result = await ctx.createSale.execute({
      userId: defaultUser.id,
      method: PaymentMethod.CASH,
      items: [
        { serviceId: service.id, quantity: 1, couponCode: couponService.code },
        { productId: product.id, quantity: 1, couponCode: couponProduct.code },
      ],
      clientId: defaultClient.id,
    })

    expect(result.sale.total).toBe(135)
    expect(result.sale.items[0].discount).toBe(10)
    expect(result.sale.items[0].discountType).toBe(DiscountType.PERCENTAGE)
    expect(result.sale.items[1].discount).toBe(10)
    expect(result.sale.items[1].discountType).toBe(DiscountType.PERCENTAGE)
    expect(product.quantity).toBe(4)
  })

  it('creates a sale with product and service items using general value coupon', async () => {
    const service = makeService('service-8', 100)
    const product = makeProduct('product-9', 50)
    const coupon = makeCoupon('cg1', 'GVAL30', 30, DiscountType.VALUE)
    ctx.serviceRepo.services.push(service)
    ctx.productRepo.products.push(product)
    ctx.couponRepo.coupons.push(coupon)

    const result = await ctx.createSale.execute({
      userId: defaultUser.id,
      method: PaymentMethod.CASH,
      items: [
        { serviceId: service.id, quantity: 1 },
        { productId: product.id, quantity: 1 },
      ],
      clientId: defaultClient.id,
      couponCode: coupon.code,
    })

    expect(result.sale.total).toBe(120)
    expect(product.quantity).toBe(4)
  })

  it('creates a sale with product and service items using general percentage coupon', async () => {
    const service = makeService('service-9', 100)
    const product = makeProduct('product-10', 50)
    const coupon = makeCoupon('cg2', 'GPERC50', 50, DiscountType.PERCENTAGE)
    ctx.serviceRepo.services.push(service)
    ctx.productRepo.products.push(product)
    ctx.couponRepo.coupons.push(coupon)

    const result = await ctx.createSale.execute({
      userId: defaultUser.id,
      method: PaymentMethod.CASH,
      items: [
        { serviceId: service.id, quantity: 1 },
        { productId: product.id, quantity: 1 },
      ],
      clientId: defaultClient.id,
      couponCode: coupon.code,
    })

    expect(result.sale.total).toBe(75)
    expect(result.sale.items[0].discount).toBe(50)
    expect(result.sale.items[1].discount).toBe(50)
    expect(result.sale.items[0].discountType).toBe(DiscountType.PERCENTAGE)
    expect(product.quantity).toBe(4)
  })

  it('creates a sale with mixed coupons', async () => {
    const service = makeService('service-10', 100)
    const product1 = makeProduct('product-11', 50)
    const product2 = makeProduct('product-12', 30)
    const couponItem = makeCoupon('ci1', 'SVC5', 5, DiscountType.VALUE)
    const couponGeneral = makeCoupon('cg3', 'G10', 10, DiscountType.VALUE)
    ctx.serviceRepo.services.push(service)
    ctx.productRepo.products.push(product1, product2)
    ctx.couponRepo.coupons.push(couponItem, couponGeneral)

    const result = await ctx.createSale.execute({
      userId: defaultUser.id,
      method: PaymentMethod.CASH,
      items: [
        { serviceId: service.id, quantity: 1, couponCode: couponItem.code },
        { productId: product1.id, quantity: 1 },
        { productId: product2.id, quantity: 1 },
      ],
      clientId: defaultClient.id,
      couponCode: couponGeneral.code,
    })

    expect(result.sale.total).toBe(165)
    expect(product1.quantity).toBe(4)
    expect(product2.quantity).toBe(4)
  })

  it('updates balances on paid sale with barber and product', async () => {
    const service = makeService('service-11', 100)
    const product = makeProduct('product-13', 50)
    const serviceBarber = makeBarberServiceRel(
      barberUser.profile.id,
      service.id,
      CommissionCalcType.PERCENTAGE_OF_USER,
    )
    const coupon = makeCoupon('pcpaid', 'PAID10', 10, DiscountType.VALUE)
    ctx.serviceRepo.services.push(service)
    ctx.productRepo.products.push(product)
    ctx.couponRepo.coupons.push(coupon)
    ctx.barberServiceRepo.items.push(serviceBarber)
    ctx.cashRepo.session = {
      id: 'session-1',
      openedById: defaultUser.id,
      unitId: 'unit-1',
      openedAt: new Date(),
      closedAt: null,
      initialAmount: 0,
      transactions: [],
      sales: [],
      finalAmount: null,
      user: defaultUser,
    }
    ctx.profilesRepo.profiles.push({ ...barberProfile, user: barberUser })

    const result = await ctx.createSale.execute({
      userId: defaultUser.id,
      method: PaymentMethod.CASH,
      items: [
        { serviceId: service.id, quantity: 1, barberId: barberUser.id },
        { productId: product.id, quantity: 1, couponCode: coupon.code },
      ],
      clientId: defaultClient.id,
      paymentStatus: PaymentStatus.PAID,
    })

    const expectedBarber =
      (service.price * barberProfile.commissionPercentage) / 100
    expect(ctx.profilesRepo.profiles[0].totalBalance).toBeCloseTo(
      expectedBarber,
    )
    const ownerShare = service.price - expectedBarber + (product.price - 10)
    expect(ctx.unitRepo.unit.totalBalance).toBeCloseTo(ownerShare)
    expect(product.quantity).toBe(4)
    expect(result.sale.total).toBe(140)
  })

  it('sets barber commission from profile when no relation exists', async () => {
    const service = makeService('service-rel1', 100)
    const serviceBarber = makeBarberServiceRel(
      barberUser.profile.id,
      service.id,
      CommissionCalcType.PERCENTAGE_OF_USER,
    )
    ctx.serviceRepo.services.push(service)
    ctx.profilesRepo.profiles.push({ ...barberProfile, user: barberUser })
    ctx.barberServiceRepo.items.push(serviceBarber)

    const result = await ctx.createSale.execute({
      userId: defaultUser.id,
      method: PaymentMethod.CASH,
      items: [{ serviceId: service.id, quantity: 1, barberId: barberUser.id }],
      clientId: defaultClient.id,
    })

    expect(result.sale.items[0].porcentagemBarbeiro).toBe(
      barberProfile.commissionPercentage,
    )
  })

  it('uses service percentage when relation type is PERCENTAGE_OF_ITEM', async () => {
    const service = {
      ...makeService('service-rel2', 100),
      commissionPercentage: 30,
    }
    ctx.serviceRepo.services.push(service)
    ctx.barberServiceRepo.items.push(
      makeBarberServiceRel(barberProfile.id, service.id, 'PERCENTAGE_OF_ITEM'),
    )
    ctx.profilesRepo.profiles.push({ ...barberProfile, user: barberUser })

    const result = await ctx.createSale.execute({
      userId: defaultUser.id,
      method: PaymentMethod.CASH,
      items: [{ serviceId: service.id, quantity: 1, barberId: barberUser.id }],
      clientId: defaultClient.id,
    })

    expect(result.sale.items[0].porcentagemBarbeiro).toBe(30)
  })

  it('uses profile percentage when relation type is PERCENTAGE_OF_USER', async () => {
    const service = {
      ...makeService('service-rel3', 100),
      commissionPercentage: 30,
    }
    ctx.serviceRepo.services.push(service)
    ctx.barberServiceRepo.items.push(
      makeBarberServiceRel(barberProfile.id, service.id, 'PERCENTAGE_OF_USER'),
    )
    ctx.profilesRepo.profiles.push({ ...barberProfile, user: barberUser })

    const result = await ctx.createSale.execute({
      userId: defaultUser.id,
      method: PaymentMethod.CASH,
      items: [{ serviceId: service.id, quantity: 1, barberId: barberUser.id }],
      clientId: defaultClient.id,
    })

    expect(result.sale.items[0].porcentagemBarbeiro).toBe(
      barberProfile.commissionPercentage,
    )
  })

  it('uses relation percentage when relation type is PERCENTAGE_OF_USER_ITEM', async () => {
    const service = {
      ...makeService('service-rel4', 100),
      commissionPercentage: 30,
    }
    ctx.serviceRepo.services.push(service)
    ctx.barberServiceRepo.items.push(
      makeBarberServiceRel(
        barberProfile.id,
        service.id,
        'PERCENTAGE_OF_USER_ITEM',
        60,
      ),
    )
    ctx.profilesRepo.profiles.push({ ...barberProfile, user: barberUser })

    const result = await ctx.createSale.execute({
      userId: defaultUser.id,
      method: PaymentMethod.CASH,
      items: [{ serviceId: service.id, quantity: 1, barberId: barberUser.id }],
      clientId: defaultClient.id,
    })

    expect(result.sale.items[0].porcentagemBarbeiro).toBe(60)
  })

  it('throws when barber lacks permission to sell product', async () => {
    const product = makeProduct('p-rel', 50)
    ctx.productRepo.products.push(product)
    const idx = ctx.barberRepo.users.findIndex((u) => u.id === barberUser.id)
    ctx.barberRepo.users[idx] = {
      ...barberUser,
      profile: { ...barberProfile, permissions: [] },
    }

    await expect(
      ctx.createSale.execute({
        userId: defaultUser.id,
        method: PaymentMethod.CASH,
        items: [
          { productId: product.id, quantity: 1, barberId: barberUser.id },
        ],
        clientId: defaultClient.id,
      }),
    ).rejects.toThrow('Permission denied')
  })

  it('requires permission to create sale', async () => {
    const product = makeProduct('p-sale', 50)
    ctx.productRepo.products.push(product)
    await expect(
      ctx.createSale.execute({
        userId: defaultUser.id,
        method: PaymentMethod.CASH,
        items: [
          { productId: product.id, quantity: 1, barberId: barberUser.id },
        ],
        clientId: defaultClient.id,
      }),
    ).rejects.toThrow('Permission denied')
  })

  it('uses profile percentage for product relation', async () => {
    const product = makeProduct('p-rel2', 50)
    ctx.productRepo.products.push(product)
    ctx.barberProductRepo.items.push(
      makeBarberProductRel(barberProfile.id, product.id, 'PERCENTAGE_OF_USER'),
    )
    const idx = ctx.barberRepo.users.findIndex((u) => u.id === barberUser.id)
    ctx.barberRepo.users[idx] = {
      ...barberUser,
      profile: {
        ...barberProfile,
        permissions: [
          {
            id: 'perm',
            name: PermissionName.SELL_PRODUCT,
            category: PermissionCategory.PRODUCT,
          },
        ],
      },
    }

    const res = await ctx.createSale.execute({
      userId: defaultUser.id,
      method: PaymentMethod.CASH,
      items: [{ productId: product.id, quantity: 1, barberId: barberUser.id }],
      clientId: defaultClient.id,
    })

    expect(res.sale.items[0].porcentagemBarbeiro).toBe(
      barberProfile.commissionPercentage,
    )
  })

  it('creates a sale from appointment', async () => {
    const service = makeService('svc-appt', 50)
    ctx.serviceRepo.services.push(service)
    ctx.barberServiceRepo.items.push(
      makeBarberServiceRel(barberProfile.id, service.id, 'PERCENTAGE_OF_USER'),
    )
    ctx.profilesRepo.profiles.push({ ...barberProfile, user: barberUser })
    const appointment = await ctx.appointmentRepo.create({
      client: { connect: { id: defaultClient.id } },
      barber: { connect: { id: barberUser.id } },
      service: { connect: { id: service.id } },
      unit: { connect: { id: 'unit-1' } },
      date: new Date('2024-01-01T09:00:00'),
      discount: 10,
      value: 40,
    })

    const res = await ctx.createSale.execute({
      userId: defaultUser.id,
      method: PaymentMethod.CASH,
      items: [{ appointmentId: appointment.id, quantity: 1 }],
      clientId: defaultClient.id,
    })

    expect(res.sale.items).toHaveLength(1)
    expect(res.sale.items[0].appointmentId).toBe(appointment.id)
    expect(res.sale.total).toBe(40)
  })

  it('fails if appointment already linked', async () => {
    const service = makeService('svc-appt2', 60)
    ctx.serviceRepo.services.push(service)
    ctx.barberServiceRepo.items.push(
      makeBarberServiceRel(barberProfile.id, service.id, 'PERCENTAGE_OF_USER'),
    )
    ctx.profilesRepo.profiles.push({ ...barberProfile, user: barberUser })
    const appointment = await ctx.appointmentRepo.create({
      client: { connect: { id: defaultClient.id } },
      barber: { connect: { id: barberUser.id } },
      service: { connect: { id: service.id } },
      unit: { connect: { id: 'unit-1' } },
      date: new Date('2024-01-02T10:00:00'),
      value: 50,
      discount: 10,
    })

    await ctx.createSale.execute({
      userId: defaultUser.id,
      method: PaymentMethod.CASH,
      items: [{ appointmentId: appointment.id, quantity: 1 }],
      clientId: defaultClient.id,
    })

    await expect(
      ctx.createSale.execute({
        userId: defaultUser.id,
        method: PaymentMethod.CASH,
        items: [],
        clientId: defaultClient.id,
        appointmentId: appointment.id,
      }),
    ).rejects.toThrow('Appointment already linked')
  })

  it('creates a sale from appointment using discount only', async () => {
    const service = makeService('svc-appt-disc', 80)
    ctx.serviceRepo.services.push(service)
    ctx.barberServiceRepo.items.push(
      makeBarberServiceRel(barberProfile.id, service.id, 'PERCENTAGE_OF_USER'),
    )
    ctx.profilesRepo.profiles.push({ ...barberProfile, user: barberUser })
    const appointment = await ctx.appointmentRepo.create({
      client: { connect: { id: defaultClient.id } },
      barber: { connect: { id: barberUser.id } },
      service: { connect: { id: service.id } },
      unit: { connect: { id: 'unit-1' } },
      date: new Date('2024-03-01T08:00:00'),
      value: 60,
    })

    const res = await ctx.createSale.execute({
      userId: defaultUser.id,
      method: PaymentMethod.CASH,
      items: [{ appointmentId: appointment.id, quantity: 1 }],
      clientId: defaultClient.id,
    })

    expect(res.sale.total).toBe(60)
    expect(res.sale.items[0].appointmentId).toBe(appointment.id)
  })

  it('creates a sale from appointment without discount', async () => {
    const service = makeService('svc-appt-none', 70)
    ctx.serviceRepo.services.push(service)
    ctx.barberServiceRepo.items.push(
      makeBarberServiceRel(barberProfile.id, service.id, 'PERCENTAGE_OF_USER'),
    )
    ctx.profilesRepo.profiles.push({ ...barberProfile, user: barberUser })
    const appointment = await ctx.appointmentRepo.create({
      client: { connect: { id: defaultClient.id } },
      barber: { connect: { id: barberUser.id } },
      service: { connect: { id: service.id } },
      unit: { connect: { id: 'unit-1' } },
      date: new Date('2024-04-01T12:00:00'),
      value: 40,
    })

    const res = await ctx.createSale.execute({
      userId: defaultUser.id,
      method: PaymentMethod.CASH,
      items: [{ appointmentId: appointment.id, quantity: 1 }],
      clientId: defaultClient.id,
    })

    expect(res.sale.total).toBe(40)
    expect(res.sale.items[0].appointmentId).toBe(appointment.id)
  })

  it('fails when appointment status is canceled', async () => {
    const service = makeService('svc-canceled', 40)
    ctx.serviceRepo.services.push(service)
    ctx.barberServiceRepo.items.push(
      makeBarberServiceRel(barberProfile.id, service.id, 'PERCENTAGE_OF_USER'),
    )
    ctx.profilesRepo.profiles.push({ ...barberProfile, user: barberUser })
    const appointment = await ctx.appointmentRepo.create({
      client: { connect: { id: defaultClient.id } },
      barber: { connect: { id: barberUser.id } },
      service: { connect: { id: service.id } },
      unit: { connect: { id: 'unit-1' } },
      date: new Date('2024-05-01T10:00:00'),
      status: 'CANCELED',
    })

    await expect(
      ctx.createSale.execute({
        userId: defaultUser.id,
        method: PaymentMethod.CASH,
        items: [{ appointmentId: appointment.id, quantity: 1 }],
        clientId: defaultClient.id,
      }),
    ).rejects.toThrow('Cannot link sale to appointment with this status')
  })

  it('concludes appointment when sale is paid', async () => {
    const service = makeService('svc-pay', 60)
    ctx.serviceRepo.services.push(service)
    ctx.barberServiceRepo.items.push(
      makeBarberServiceRel(barberProfile.id, service.id, 'PERCENTAGE_OF_USER'),
    )
    ctx.profilesRepo.profiles.push({ ...barberProfile, user: barberUser })
    const appointment = await ctx.appointmentRepo.create({
      client: { connect: { id: defaultClient.id } },
      barber: { connect: { id: barberUser.id } },
      service: { connect: { id: service.id } },
      unit: { connect: { id: 'unit-1' } },
      date: new Date('2024-06-01T09:00:00'),
    })

    await ctx.createSale.execute({
      userId: defaultUser.id,
      method: PaymentMethod.CASH,
      items: [{ appointmentId: appointment.id, quantity: 1 }],
      clientId: defaultClient.id,
      paymentStatus: PaymentStatus.PAID,
    })

    expect(
      ctx.appointmentRepo.appointments.find((a) => a.id === appointment.id)?.status,
    ).toBe('CONCLUDED')
  })
})
