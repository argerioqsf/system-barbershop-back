import {
  DiscountType,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  Service,
  Product,
  Coupon,
  User,
  Profile,
  Unit,
  Organization,
  CashRegisterSession,
  Transaction,
  TransactionType,
} from '@prisma/client'
import { ServiceRepository } from '@/repositories/service-repository'
import { ProductRepository } from '@/repositories/product-repository'
import { CouponRepository } from '@/repositories/coupon-repository'
import { SaleRepository, DetailedSale, DetailedSaleItem } from '@/repositories/sale-repository'
import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { CashRegisterRepository, CompleteCashSession } from '@/repositories/cash-register-repository'
import { TransactionRepository } from '@/repositories/transaction-repository'
import { OrganizationRepository } from '@/repositories/organization-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { UnitRepository } from '@/repositories/unit-repository'
import { randomUUID } from 'crypto'

export class FakeServiceRepository implements ServiceRepository {
  constructor(public services: Service[] = []) {}
  create(data: Prisma.ServiceCreateInput): Promise<Service> { throw new Error('not implemented') }
  findManyByUnit(unitId: string): Promise<Service[]> { throw new Error('not implemented') }
  findMany(where?: Prisma.ServiceWhereInput): Promise<Service[]> { throw new Error('not implemented') }
  async findById(id: string): Promise<Service | null> {
    return this.services.find(s => s.id === id) ?? null
  }
}

export class FakeProductRepository implements ProductRepository {
  constructor(public products: Product[] = []) {}
  create(data: Prisma.ProductCreateInput): Promise<Product> { throw new Error('not implemented') }
  findMany(where?: Prisma.ProductWhereInput): Promise<Product[]> { throw new Error('not implemented') }
  async findById(id: string): Promise<Product | null> {
    return this.products.find(p => p.id === id) ?? null
  }
  async update(id: string, data: Prisma.ProductUpdateInput): Promise<Product> {
    const product = this.products.find(p => p.id === id)
    if (!product) throw new Error('Product not found')
    if (data.quantity && typeof data.quantity === 'object' && 'decrement' in data.quantity) {
      product.quantity -= (data.quantity.decrement as number)
    }
    return product
  }
  delete(id: string): Promise<void> { throw new Error('not implemented') }
}

export class FakeCouponRepository implements CouponRepository {
  constructor(public coupons: Coupon[] = []) {}
  create(data: Prisma.CouponCreateInput): Promise<Coupon> { throw new Error('not implemented') }
  findMany(where?: Prisma.CouponWhereInput): Promise<Coupon[]> { throw new Error('not implemented') }
  findById(id: string): Promise<Coupon | null> { throw new Error('not implemented') }
  async findByCode(code: string): Promise<Coupon | null> {
    return this.coupons.find(c => c.code === code) ?? null
  }
  async update(id: string, data: Prisma.CouponUpdateInput): Promise<Coupon> {
    const coupon = this.coupons.find(c => c.id === id)
    if (!coupon) throw new Error('Coupon not found')
    if (data.quantity && typeof data.quantity === 'object' && 'decrement' in data.quantity) {
      coupon.quantity -= (data.quantity.decrement as number)
    }
    return coupon
  }
  delete(id: string): Promise<void> { throw new Error('not implemented') }
}

export class FakeBarberUsersRepository implements BarberUsersRepository {
  constructor(public users: (User & { profile: Profile | null; unit?: Unit | null })[] = []) {}
  create(data: Prisma.UserCreateInput, profile: Omit<Prisma.ProfileCreateInput, 'user'>): Promise<{ user: User; profile: Profile; }> { throw new Error('not implemented') }
  update(id: string, userData: Prisma.UserUpdateInput, profileData: Prisma.ProfileUpdateInput): Promise<{ user: User; profile: Profile | null; }> { throw new Error('not implemented') }
  findMany(where?: Prisma.UserWhereInput): Promise<(User & { profile: Profile | null; })[]> { throw new Error('not implemented') }
  async findById(id: string): Promise<(User & { profile: Profile | null; unit: Unit | null; }) | null> {
    const user = this.users.find(u => u.id === id)
    if (!user) return null
    return { ...user, unit: user.unit ?? null }
  }
  findByEmail(email: string): Promise<User | null> { throw new Error('not implemented') }
  delete(id: string): Promise<void> { throw new Error('not implemented') }
}

export class FakeCashRegisterRepository implements CashRegisterRepository {
  constructor(public session: (CashRegisterSession & { transactions: Transaction[] }) | null = null) {}
  create(data: Prisma.CashRegisterSessionCreateInput): Promise<CashRegisterSession> { throw new Error('not implemented') }
  close(id: string, data: Prisma.CashRegisterSessionUpdateInput): Promise<CashRegisterSession> { throw new Error('not implemented') }
  findMany(where?: Prisma.CashRegisterSessionWhereInput): Promise<any[]> { throw new Error('not implemented') }
  findManyByUnit(unitId: string): Promise<any[]> { throw new Error('not implemented') }
  findOpenByUser(userId: string): Promise<CashRegisterSession | null> { throw new Error('not implemented') }
  async findOpenByUnit(unitId: string): Promise<(CashRegisterSession & { transactions: Transaction[] }) | null> {
    return this.session
  }
  findById(id: string): Promise<CompleteCashSession | null> { throw new Error('not implemented') }
}

export class FakeTransactionRepository implements TransactionRepository {
  public transactions: Transaction[] = []
  async create(data: Prisma.TransactionCreateInput): Promise<Transaction> {
    const tr: Transaction = {
      id: randomUUID(),
      userId: (data.user as any).connect.id,
      affectedUserId: (data.affectedUser as any)?.connect.id,
      unitId: (data.unit as any).connect.id,
      cashRegisterSessionId: (data.session as any).connect.id,
      type: data.type as TransactionType,
      description: data.description as string,
      amount: data.amount as number,
      createdAt: new Date(),
    }
    this.transactions.push(tr)
    return tr
  }
  findManyByUser(userId: string): Promise<Transaction[]> { throw new Error('not implemented') }
  findMany(where?: Prisma.TransactionWhereInput): Promise<Transaction[]> { throw new Error('not implemented') }
  findManyByUnit(unitId: string): Promise<Transaction[]> { throw new Error('not implemented') }
  findManyBySession(sessionId: string): Promise<Transaction[]> { throw new Error('not implemented') }
  async delete(id: string): Promise<void> {
    this.transactions = this.transactions.filter(t => t.id !== id)
  }
}

export class FakeOrganizationRepository implements OrganizationRepository {
  constructor(public organization: Organization) {}
  create(data: Prisma.OrganizationCreateInput): Promise<Organization> { throw new Error('not implemented') }
  async findById(id: string): Promise<Organization | null> {
    return this.organization.id === id ? this.organization : null
  }
  findMany(): Promise<Organization[]> { throw new Error('not implemented') }
  update(id: string, data: Prisma.OrganizationUpdateInput): Promise<Organization> { throw new Error('not implemented') }
  delete(id: string): Promise<void> { throw new Error('not implemented') }
  async incrementBalance(id: string, amount: number): Promise<void> {
    if (this.organization.id === id) {
      this.organization.totalBalance += amount
    }
  }
}

export class FakeProfilesRepository implements ProfilesRepository {
  constructor(public profiles: (Profile & { user: Omit<User, 'password'> })[] = []) {}
  async findById(id: string): Promise<(Profile & { user: Omit<User, 'password'> }) | null> {
    return this.profiles.find(p => p.id === id) ?? null
  }
  create(data: Prisma.ProfileUncheckedCreateInput): Promise<Profile> { throw new Error('not implemented') }
  async findByUserId(userId: string): Promise<(Profile & { user: Omit<User, 'password'> }) | null> {
    return this.profiles.find(p => p.user.id === userId) ?? null
  }
  update(id: string, data: Prisma.ProfileUncheckedUpdateInput): Promise<Profile> { throw new Error('not implemented') }
  findMany(where?: Prisma.ProfileWhereInput, orderBy?: Prisma.ProfileOrderByWithRelationInput): Promise<(Profile & { user: Omit<User, 'password'> })[]> { throw new Error('not implemented') }
  async incrementBalance(userId: string, amount: number): Promise<void> {
    const profile = this.profiles.find(p => p.user.id === userId)
    if (profile) {
      profile.totalBalance += amount
    }
  }
}

export class FakeUnitRepository implements UnitRepository {
  constructor(public unit: Unit) {}
  create(data: Prisma.UnitCreateInput): Promise<Unit> { throw new Error('not implemented') }
  findById(id: string): Promise<Unit | null> { throw new Error('not implemented') }
  findManyByOrganization(organizationId: string): Promise<Unit[]> { throw new Error('not implemented') }
  findMany(): Promise<Unit[]> { throw new Error('not implemented') }
  update(id: string, data: Prisma.UnitUpdateInput): Promise<Unit> { throw new Error('not implemented') }
  delete(id: string): Promise<void> { throw new Error('not implemented') }
  async incrementBalance(id: string, amount: number): Promise<void> {
    if (this.unit.id === id) {
      this.unit.totalBalance += amount
    }
  }
}

export class FakeSaleRepository implements SaleRepository {
  public sales: DetailedSale[] = []
  async create(data: Prisma.SaleCreateInput): Promise<DetailedSale> {
    const saleId = randomUUID()
    const itemsData = (data.items as any).create as any[]
    const items: DetailedSaleItem[] = itemsData.map((it: any) => ({
      id: randomUUID(),
      saleId,
      serviceId: it.service?.connect.id,
      productId: it.product?.connect.id,
      quantity: it.quantity,
      barberId: it.barber?.connect.id,
      couponId: it.coupon?.connect.id,
      price: it.price as number,
      discount: it.discount ?? null,
      discountType: it.discountType ?? null,
      porcentagemBarbeiro: it.porcentagemBarbeiro ?? null,
      service: it.service ? { id: it.service.connect.id, name: '', description: null, imageUrl: null, cost: 0, price: 0, unitId: 'unit-1' } : null,
      product: it.product ? { id: it.product.connect.id, name: '', description: null, imageUrl: null, quantity: 0, cost: 0, price: 0, unitId: 'unit-1' } : null,
      barber: it.barber ? { id: it.barber.connect.id, name: '', email: '', password: '', active: true, organizationId: 'org-1', unitId: 'unit-1', createdAt: new Date(), profile: { id: 'profile-' + it.barber.connect.id, phone: '', cpf: '', genre: '', birthday: '', pix: '', role: 'BARBER' as any, commissionPercentage: it.porcentagemBarbeiro ?? 100, totalBalance: 0, userId: it.barber.connect.id, createdAt: new Date() } } : null,
      coupon: it.coupon ? { id: it.coupon.connect.id, code: '', description: null, discount: 0, discountType: DiscountType.VALUE, imageUrl: null, quantity: 0, unitId: 'unit-1', createdAt: new Date() } : null,
    }))
    const sale: DetailedSale = {
      id: saleId,
      userId: (data.user as any).connect.id,
      clientId: (data.client as any).connect.id,
      unitId: (data.unit as any).connect.id,
      sessionId: (data.session as any)?.connect.id,
      couponId: (data.coupon as any)?.connect.id,
      transactionId: (data.transaction as any)?.connect.id,
      total: data.total as number,
      method: data.method as PaymentMethod,
      paymentStatus: data.paymentStatus as PaymentStatus,
      createdAt: new Date(),
      items,
      user: { id: (data.user as any).connect.id, name: '', email: '', password: '', active: true, organizationId: 'org-1', unitId: 'unit-1', createdAt: new Date(), profile: null },
      client: { id: (data.client as any).connect.id, name: '', email: '', password: '', active: true, organizationId: 'org-1', unitId: 'unit-1', createdAt: new Date(), profile: null },
      coupon: data.coupon ? { id: (data.coupon as any).connect.id, code: '', description: null, discount: 0, discountType: DiscountType.VALUE, imageUrl: null, quantity: 0, unitId: 'unit-1', createdAt: new Date() } : null,
      session: null,
      transaction: data.transaction ? { id: (data.transaction as any).connect.id, userId: '', affectedUserId: null, unitId: '', cashRegisterSessionId: '', type: TransactionType.ADDITION, description: '', amount: data.total as number, createdAt: new Date() } : null,
    }
    this.sales.push(sale)
    return sale
  }
  findMany(where?: Prisma.SaleWhereInput): Promise<DetailedSale[]> { throw new Error('not implemented') }
  findById(id: string): Promise<DetailedSale | null> { throw new Error('not implemented') }
  update(id: string, data: Prisma.SaleUpdateInput): Promise<DetailedSale> { throw new Error('not implemented') }
  findManyByDateRange(start: Date, end: Date): Promise<DetailedSale[]> { throw new Error('not implemented') }
  findManyByUser(userId: string): Promise<DetailedSale[]> { throw new Error('not implemented') }
  findManyByBarber(barberId: string): Promise<DetailedSale[]> { throw new Error('not implemented') }
  findManyBySession(sessionId: string): Promise<DetailedSale[]> { throw new Error('not implemented') }
}
