import { describe, it, expect, beforeEach } from 'vitest'
import { PaymentMethod, DiscountType, PaymentStatus } from '@prisma/client'
import { CreateSaleService } from '../src/services/sale/create-sale'
import {
  FakeServiceRepository,
  FakeProductRepository,
  FakeCouponRepository,
  FakeSaleRepository,
  FakeBarberUsersRepository,
  FakeCashRegisterRepository,
  FakeTransactionRepository,
  FakeOrganizationRepository,
  FakeProfilesRepository,
  FakeUnitRepository,
} from './helpers/fake-repositories'

import { randomUUID } from 'crypto'
import {
  defaultUser,
  defaultClient,
  barberProfile,
  barberUser,
} from './helpers/default-values'

function setup() {
  const serviceRepo = new FakeServiceRepository()
  const productRepo = new FakeProductRepository()
  const couponRepo = new FakeCouponRepository()
  const saleRepo = new FakeSaleRepository()
  const barberRepo = new FakeBarberUsersRepository()
  const cashRepo = new FakeCashRegisterRepository()
  const transactionRepo = new FakeTransactionRepository()
  const organization = { id: 'org-1', name: 'Org', slug: 'org', ownerId: null, totalBalance: 0, createdAt: new Date() }
  const organizationRepo = new FakeOrganizationRepository(organization)
  const profilesRepo = new FakeProfilesRepository()
  const unit = { id: 'unit-1', name: 'Unit', slug: 'unit', organizationId: 'org-1', totalBalance: 0, allowsLoan: false }
  const unitRepo = new FakeUnitRepository(unit)

  const createSale = new CreateSaleService(
    saleRepo,
    serviceRepo,
    productRepo,
    couponRepo,
    barberRepo,
    cashRepo,
    transactionRepo,
    organizationRepo,
    profilesRepo,
    unitRepo,
  )

  return {
    serviceRepo,
    productRepo,
    couponRepo,
    saleRepo,
    barberRepo,
    cashRepo,
    transactionRepo,
    organizationRepo,
    profilesRepo,
    unitRepo,
    createSale,
  }
}


describe('Create sale service', () => {
  let ctx: ReturnType<typeof setup>
  beforeEach(() => {
    ctx = setup()
    ctx.barberRepo.users.push(defaultUser, defaultClient, barberUser)
  })

  it('creates a sale with one service item without coupon', async () => {
    const service = { id: 'service-1', name: '', description: null, imageUrl: null, cost: 0, price: 100, unitId: 'unit-1' }
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
    const service = { id: 'service-1', name: '', description: null, imageUrl: null, cost: 0, price: 100, unitId: 'unit-1' }
    const coupon = { id: 'c1', code: 'VAL10', description: null, discount: 10, discountType: DiscountType.VALUE, imageUrl: null, quantity: 5, unitId: 'unit-1', createdAt: new Date() }
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
    const service = { id: 'service-2', name: '', description: null, imageUrl: null, cost: 0, price: 100, unitId: 'unit-1' }
    const coupon = { id: 'c2', code: 'PERC10', description: null, discount: 10, discountType: DiscountType.PERCENTAGE, imageUrl: null, quantity: 5, unitId: 'unit-1', createdAt: new Date() }
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
    const service = { id: 'service-3', name: '', description: null, imageUrl: null, cost: 0, price: 100, unitId: 'unit-1' }
    const coupon = { id: 'c3', code: 'VAL20', description: null, discount: 20, discountType: DiscountType.VALUE, imageUrl: null, quantity: 5, unitId: 'unit-1', createdAt: new Date() }
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
    const service = { id: 'service-4', name: '', description: null, imageUrl: null, cost: 0, price: 100, unitId: 'unit-1' }
    const coupon = { id: 'c4', code: 'P20', description: null, discount: 20, discountType: DiscountType.PERCENTAGE, imageUrl: null, quantity: 5, unitId: 'unit-1', createdAt: new Date() }
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
    const product = { id: 'product-1', name: '', description: null, imageUrl: null, quantity: 5, cost: 0, price: 50, unitId: 'unit-1' }
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
    const product = { id: 'product-2', name: '', description: null, imageUrl: null, quantity: 5, cost: 0, price: 50, unitId: 'unit-1' }
    const coupon = { id: 'pc1', code: 'PV10', description: null, discount: 10, discountType: DiscountType.VALUE, imageUrl: null, quantity: 5, unitId: 'unit-1', createdAt: new Date() }
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
    const product = { id: 'product-3', name: '', description: null, imageUrl: null, quantity: 5, cost: 0, price: 50, unitId: 'unit-1' }
    const coupon = { id: 'pc2', code: 'PP10', description: null, discount: 10, discountType: DiscountType.PERCENTAGE, imageUrl: null, quantity: 5, unitId: 'unit-1', createdAt: new Date() }
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
    const product = { id: 'product-4', name: '', description: null, imageUrl: null, quantity: 5, cost: 0, price: 50, unitId: 'unit-1' }
    const coupon = { id: 'pc3', code: 'GV30', description: null, discount: 30, discountType: DiscountType.VALUE, imageUrl: null, quantity: 5, unitId: 'unit-1', createdAt: new Date() }
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
    const product = { id: 'product-5', name: '', description: null, imageUrl: null, quantity: 5, cost: 0, price: 50, unitId: 'unit-1' }
    const coupon = { id: 'pc4', code: 'GP50', description: null, discount: 50, discountType: DiscountType.PERCENTAGE, imageUrl: null, quantity: 5, unitId: 'unit-1', createdAt: new Date() }
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
    const service = { id: 'service-5', name: '', description: null, imageUrl: null, cost: 0, price: 100, unitId: 'unit-1' }
    const product = { id: 'product-6', name: '', description: null, imageUrl: null, quantity: 5, cost: 0, price: 50, unitId: 'unit-1' }
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
    const service = { id: 'service-6', name: '', description: null, imageUrl: null, cost: 0, price: 100, unitId: 'unit-1' }
    const product = { id: 'product-7', name: '', description: null, imageUrl: null, quantity: 5, cost: 0, price: 50, unitId: 'unit-1' }
    const couponService = { id: 'cs5', code: 'SV5', description: null, discount: 5, discountType: DiscountType.VALUE, imageUrl: null, quantity: 5, unitId: 'unit-1', createdAt: new Date() }
    const couponProduct = { id: 'cp5', code: 'PV5', description: null, discount: 5, discountType: DiscountType.VALUE, imageUrl: null, quantity: 5, unitId: 'unit-1', createdAt: new Date() }
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
    const service = { id: 'service-7', name: '', description: null, imageUrl: null, cost: 0, price: 100, unitId: 'unit-1' }
    const product = { id: 'product-8', name: '', description: null, imageUrl: null, quantity: 5, cost: 0, price: 50, unitId: 'unit-1' }
    const couponService = { id: 'cs6', code: 'SV10P', description: null, discount: 10, discountType: DiscountType.PERCENTAGE, imageUrl: null, quantity: 5, unitId: 'unit-1', createdAt: new Date() }
    const couponProduct = { id: 'cp6', code: 'PV10P', description: null, discount: 10, discountType: DiscountType.PERCENTAGE, imageUrl: null, quantity: 5, unitId: 'unit-1', createdAt: new Date() }
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
    const service = { id: 'service-8', name: '', description: null, imageUrl: null, cost: 0, price: 100, unitId: 'unit-1' }
    const product = { id: 'product-9', name: '', description: null, imageUrl: null, quantity: 5, cost: 0, price: 50, unitId: 'unit-1' }
    const coupon = { id: 'cg1', code: 'GVAL30', description: null, discount: 30, discountType: DiscountType.VALUE, imageUrl: null, quantity: 5, unitId: 'unit-1', createdAt: new Date() }
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
    const service = { id: 'service-9', name: '', description: null, imageUrl: null, cost: 0, price: 100, unitId: 'unit-1' }
    const product = { id: 'product-10', name: '', description: null, imageUrl: null, quantity: 5, cost: 0, price: 50, unitId: 'unit-1' }
    const coupon = { id: 'cg2', code: 'GPERC50', description: null, discount: 50, discountType: DiscountType.PERCENTAGE, imageUrl: null, quantity: 5, unitId: 'unit-1', createdAt: new Date() }
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
    const service = { id: 'service-10', name: '', description: null, imageUrl: null, cost: 0, price: 100, unitId: 'unit-1' }
    const product1 = { id: 'product-11', name: '', description: null, imageUrl: null, quantity: 5, cost: 0, price: 50, unitId: 'unit-1' }
    const product2 = { id: 'product-12', name: '', description: null, imageUrl: null, quantity: 5, cost: 0, price: 30, unitId: 'unit-1' }
    const couponItem = { id: 'ci1', code: 'SVC5', description: null, discount: 5, discountType: DiscountType.VALUE, imageUrl: null, quantity: 5, unitId: 'unit-1', createdAt: new Date() }
    const couponGeneral = { id: 'cg3', code: 'G10', description: null, discount: 10, discountType: DiscountType.VALUE, imageUrl: null, quantity: 5, unitId: 'unit-1', createdAt: new Date() }
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
    const service = { id: 'service-11', name: '', description: null, imageUrl: null, cost: 0, price: 100, unitId: 'unit-1' }
    const product = { id: 'product-13', name: '', description: null, imageUrl: null, quantity: 5, cost: 0, price: 50, unitId: 'unit-1' }
    const coupon = { id: 'pcpaid', code: 'PAID10', description: null, discount: 10, discountType: DiscountType.VALUE, imageUrl: null, quantity: 5, unitId: 'unit-1', createdAt: new Date() }
    ctx.serviceRepo.services.push(service)
    ctx.productRepo.products.push(product)
    ctx.couponRepo.coupons.push(coupon)
    ctx.cashRepo.session = { id: 'session-1', openedById: defaultUser.id, unitId: 'unit-1', openedAt: new Date(), closedAt: null, initialAmount: 0, transactions: [], sales: [], finalAmount: null }
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

    const expectedBarber = (service.price * barberProfile.commissionPercentage) / 100
    expect(ctx.profilesRepo.profiles[0].totalBalance).toBeCloseTo(expectedBarber)
    const ownerShare = service.price - expectedBarber + (product.price - 10)
    expect(ctx.unitRepo.unit.totalBalance).toBeCloseTo(ownerShare)
    expect(ctx.organizationRepo.organization.totalBalance).toBeCloseTo(ownerShare)
    expect(product.quantity).toBe(4)
    expect(result.sale.total).toBe(140)
  })
})
