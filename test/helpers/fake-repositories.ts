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
  Sale,
  Role,
  PasswordResetToken,
} from '@prisma/client'
import { ProductRepository } from '../../src/repositories/product-repository'
import { CouponRepository } from '../../src/repositories/coupon-repository'
import {
  SaleRepository,
  DetailedSale,
  DetailedSaleItem,
} from '../../src/repositories/sale-repository'
import { BarberUsersRepository } from '../../src/repositories/barber-users-repository'
import {
  CashRegisterRepository,
  CompleteCashSession,
} from '../../src/repositories/cash-register-repository'
import { TransactionRepository } from '../../src/repositories/transaction-repository'
import { OrganizationRepository } from '../../src/repositories/organization-repository'
import { ProfilesRepository } from '../../src/repositories/profiles-repository'
import { UnitRepository } from '../../src/repositories/unit-repository'
import { PasswordResetTokenRepository } from '../../src/repositories/password-reset-token-repository'
import { randomUUID } from 'crypto'
import { ServiceRepository } from '../../src/repositories/service-repository'
import { TransactionFull } from '../../src/repositories/prisma/prisma-transaction-repository'

export class FakeServiceRepository implements ServiceRepository {
  constructor(public services: (Service & { organizationId?: string })[] = []) {}

  async create(data: Prisma.ServiceCreateInput): Promise<Service> {
    const service: Service = {
      id: randomUUID(),
      name: data.name,
      description: (data.description as string | null) ?? null,
      imageUrl: (data.imageUrl as string | null) ?? null,
      cost: data.cost as number,
      price: data.price as number,
      unitId: (data.unit as any).connect.id,
    }
    this.services.push(service)
    return service
  }

  async findManyByUnit(unitId: string): Promise<Service[]> {
    return this.services.filter((s) => s.unitId === unitId)
  }

  async findMany(where: Prisma.ServiceWhereInput = {}): Promise<Service[]> {
    return this.services.filter((s: any) => {
      if (where.unitId && s.unitId !== where.unitId) return false
      if (where.unit && 'organizationId' in (where.unit as any)) {
        return s.organizationId === (where.unit as any).organizationId
      }
      return true
    })
  }

  async findById(id: string): Promise<Service | null> {
    return this.services.find((s) => s.id === id) ?? null
  }
}

export class FakeProductRepository implements ProductRepository {
  constructor(public products: Product[] = []) {}
  async create(data: Prisma.ProductCreateInput): Promise<Product> {
    const product: Product = {
      id: randomUUID(),
      name: data.name,
      description: (data.description as string | null) ?? null,
      imageUrl: (data.imageUrl as string | null) ?? null,
      quantity: (data.quantity as number) ?? 0,
      cost: data.cost as number,
      price: data.price as number,
      unitId: (data.unit as any).connect.id,
    }
    this.products.push(product)
    return product
  }

  async findMany(where: Prisma.ProductWhereInput = {}): Promise<Product[]> {
    return this.products.filter((p: any) => {
      if (where.unitId && p.unitId !== where.unitId) return false
      if (where.unit && 'organizationId' in (where.unit as any)) {
        return p.organizationId === (where.unit as any).organizationId
      }
      return true
    })
  }

  async findById(id: string): Promise<Product | null> {
    return this.products.find((p) => p.id === id) ?? null
  }

  async update(id: string, data: Prisma.ProductUpdateInput): Promise<Product> {
    const product = this.products.find((p) => p.id === id)
    if (!product) throw new Error('Product not found')
    if (
      data.quantity &&
      typeof data.quantity === 'object' &&
      'decrement' in data.quantity
    ) {
      product.quantity -= data.quantity.decrement as number
    }
    if (data.name) product.name = data.name as string
    if ('description' in data) {
      product.description = data.description as any
    }
    if ('imageUrl' in data) {
      product.imageUrl = data.imageUrl as any
    }
    if (data.cost) product.cost = data.cost as number
    if (data.price) product.price = data.price as number
    return product
  }

  async delete(id: string): Promise<void> {
    this.products = this.products.filter((p) => p.id !== id)
  }
}

export class FakeCouponRepository implements CouponRepository {
  constructor(public coupons: Coupon[] = []) {}
  async create(data: Prisma.CouponCreateInput): Promise<Coupon> {
    const coupon: Coupon = {
      id: randomUUID(),
      code: data.code,
      description: (data.description as string | null) ?? null,
      discount: data.discount as number,
      discountType: data.discountType as any,
      imageUrl: (data.imageUrl as string | null) ?? null,
      quantity: (data.quantity as number) ?? 0,
      unitId: (data.unit as any).connect.id,
      createdAt: new Date(),
    }
    this.coupons.push(coupon)
    return coupon
  }

  async findMany(where: Prisma.CouponWhereInput = {}): Promise<Coupon[]> {
    return this.coupons.filter((c: any) => {
      if (where.unitId && c.unitId !== where.unitId) return false
      if (where.unit && 'organizationId' in (where.unit as any)) {
        return c.organizationId === (where.unit as any).organizationId
      }
      return true
    })
  }

  async findById(id: string): Promise<Coupon | null> {
    return this.coupons.find((c) => c.id === id) ?? null
  }

  async findByCode(code: string): Promise<Coupon | null> {
    return this.coupons.find((c) => c.code === code) ?? null
  }

  async update(id: string, data: Prisma.CouponUpdateInput): Promise<Coupon> {
    const coupon = this.coupons.find((c) => c.id === id)
    if (!coupon) throw new Error('Coupon not found')
    if (
      data.quantity &&
      typeof data.quantity === 'object' &&
      'decrement' in data.quantity
    ) {
      coupon.quantity -= data.quantity.decrement as number
    }
    return coupon
  }

  async delete(id: string): Promise<void> {
    this.coupons = this.coupons.filter((c) => c.id !== id)
  }
}

export class FakeBarberUsersRepository implements BarberUsersRepository {
  constructor(
    public users: (User & {
      profile: Profile | null
      unit?: Unit | null
    })[] = [],
  ) {}

  create(
    data: Prisma.UserCreateInput,
    profile: Omit<Prisma.ProfileCreateInput, 'user'>,
  ): Promise<{ user: User; profile: Profile }> {
    throw new Error('not implemented')
  }

  update(
    id: string,
    userData: Prisma.UserUpdateInput,
    profileData: Prisma.ProfileUpdateInput,
  ): Promise<{ user: User; profile: Profile | null }> {
    throw new Error('not implemented')
  }

  findMany(
    where?: Prisma.UserWhereInput,
  ): Promise<(User & { profile: Profile | null })[]> {
    return Promise.resolve(
      this.users.filter((u: any) => {
        if (where?.unitId && u.unit?.id !== where.unitId) return false
        if (where?.organizationId && u.organizationId !== where.organizationId)
          return false
        return true
      }),
    )
  }

  async findById(
    id: string,
  ): Promise<(User & { profile: Profile | null; unit: Unit | null }) | null> {
    const user = this.users.find((u) => u.id === id)
    if (!user) return null
    return { ...user, unit: user.unit ?? null }
  }

  findByEmail(email: string): Promise<User | null> {
    throw new Error('not implemented')
  }

  delete(id: string): Promise<void> {
    throw new Error('not implemented')
  }
}

export class FakeCashRegisterRepository implements CashRegisterRepository {
  constructor(
    public session:
      | (CashRegisterSession & { transactions: Transaction[]; sales: Sale[] })
      | null = null,
  ) {}

  create(
    data: Prisma.CashRegisterSessionCreateInput,
  ): Promise<CashRegisterSession> {
    throw new Error('not implemented')
  }

  close(
    id: string,
    data: Prisma.CashRegisterSessionUpdateInput,
  ): Promise<CashRegisterSession> {
    throw new Error('not implemented')
  }

  findMany(where?: Prisma.CashRegisterSessionWhereInput): Promise<any[]> {
    throw new Error('not implemented')
  }

  findManyByUnit(unitId: string): Promise<any[]> {
    throw new Error('not implemented')
  }

  findOpenByUser(userId: string): Promise<CashRegisterSession | null> {
    throw new Error('not implemented')
  }

  async findOpenByUnit(
    unitId: string,
  ): Promise<(CashRegisterSession & { transactions: Transaction[] }) | null> {
    return this.session
  }

  async findById(id: string): Promise<CompleteCashSession | null> {
    if (!this.session || this.session.id !== id) return null
    return this.session as CompleteCashSession
  }
}

export class FakeTransactionRepository implements TransactionRepository {
  public transactions: TransactionFull[] = []
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

  async findManyByUser(userId: string): Promise<TransactionFull[]> {
    return this.transactions.filter((t: any) => t.userId === userId)
  }

  async findMany(where: Prisma.TransactionWhereInput = {}): Promise<TransactionFull[]> {
    return this.transactions.filter((t: any) => {
      if (where.unitId && t.unitId !== where.unitId) return false
      if (where.unit && 'organizationId' in (where.unit as any)) {
        return t.unit?.organizationId === (where.unit as any).organizationId
      }
      return true
    })
  }

  findManyByUnit(unitId: string): Promise<Transaction[]> {
    throw new Error('not implemented')
  }

  findManyBySession(sessionId: string): Promise<Transaction[]> {
    throw new Error('not implemented')
  }

  async delete(id: string): Promise<void> {
    this.transactions = this.transactions.filter((t) => t.id !== id)
  }
}

export class FakeOrganizationRepository implements OrganizationRepository {
  constructor(
    public organization: Organization,
    public organizations: Organization[] = [organization],
  ) {}

  async create(data: Prisma.OrganizationCreateInput): Promise<Organization> {
    const org: Organization = {
      id: randomUUID(),
      name: data.name,
      slug: data.slug,
      ownerId: null,
      totalBalance: 0,
      createdAt: new Date(),
    }
    this.organizations.push(org)
    return org
  }

  async findById(id: string): Promise<Organization | null> {
    return this.organizations.find((o) => o.id === id) ?? null
  }

  async findMany(): Promise<Organization[]> {
    return this.organizations
  }

  async update(
    id: string,
    data: Prisma.OrganizationUpdateInput,
  ): Promise<Organization> {
    const org = this.organizations.find((o) => o.id === id)
    if (!org) throw new Error('Organization not found')
    if (data.name) org.name = data.name as string
    if (data.slug) org.slug = data.slug as string
    return org
  }

  async delete(id: string): Promise<void> {
    this.organizations = this.organizations.filter((o) => o.id !== id)
  }

  async incrementBalance(id: string, amount: number): Promise<void> {
    const org = this.organizations.find((o) => o.id === id)
    if (org) {
      org.totalBalance += amount
    }
    if (this.organization.id === id && org !== this.organization) {
      this.organization.totalBalance += amount
    }
  }
}

export class FakeProfilesRepository implements ProfilesRepository {
  constructor(
    public profiles: (Profile & { user: Omit<User, 'password'> })[] = [],
  ) {}

  async findById(
    id: string,
  ): Promise<(Profile & { user: Omit<User, 'password'> }) | null> {
    return this.profiles.find((p) => p.id === id) ?? null
  }

  async create(data: Prisma.ProfileUncheckedCreateInput): Promise<Profile> {
    const profile: Profile = {
      id: randomUUID(),
      phone: data.phone as string,
      cpf: data.cpf as string,
      genre: data.genre as string,
      birthday: data.birthday as string,
      pix: data.pix as string,
      role: data.role as Role,
      commissionPercentage: (data as any).commissionPercentage ?? 100,
      totalBalance: 0,
      userId: data.userId,
      createdAt: new Date(),
    }
    this.profiles.push({
      ...profile,
      user: { id: data.userId, name: '', email: '', password: '', active: true, organizationId: 'org-1', unitId: 'unit-1', createdAt: new Date() },
    })
    return profile
  }

  async findByUserId(
    userId: string,
  ): Promise<(Profile & { user: Omit<User, 'password'> }) | null> {
    return this.profiles.find((p) => p.user.id === userId) ?? null
  }

  update(
    id: string,
    data: Prisma.ProfileUncheckedUpdateInput,
  ): Promise<Profile> {
    const index = this.profiles.findIndex((p) => p.id === id)
    if (index < 0) throw new Error('Profile not found')
    const current = this.profiles[index]
    const updated = { ...current, ...(data as any) }
    this.profiles[index] = updated
    return updated
  }

  findMany(
    where?: Prisma.ProfileWhereInput,
    orderBy?: Prisma.ProfileOrderByWithRelationInput,
  ): Promise<(Profile & { user: Omit<User, 'password'> })[]> {
    throw new Error('not implemented')
  }

  async incrementBalance(userId: string, amount: number): Promise<void> {
    const profile = this.profiles.find((p) => p.user.id === userId)
    if (profile) {
      profile.totalBalance += amount
    }
  }
}

export class FakeUnitRepository implements UnitRepository {
  constructor(public unit: Unit, public units: Unit[] = [unit]) {}
  create(data: Prisma.UnitCreateInput): Promise<Unit> {
    throw new Error('not implemented')
  }

  async findById(id: string): Promise<Unit | null> {
    return this.units.find((u) => u.id === id) ?? null
  }

  async findManyByOrganization(organizationId: string): Promise<Unit[]> {
    return this.units.filter((u) => u.organizationId === organizationId)
  }

  async findMany(): Promise<Unit[]> {
    return this.units
  }

  async update(id: string, data: Prisma.UnitUpdateInput): Promise<Unit> {
    const unit = this.units.find((u) => u.id === id)
    if (!unit) throw new Error('Unit not found')
    Object.assign(unit, data as any)
    return unit
  }

  delete(id: string): Promise<void> {
    throw new Error('not implemented')
  }

  async incrementBalance(id: string, amount: number): Promise<void> {
    const unit = this.units.find((u) => u.id === id)
    if (unit) {
      unit.totalBalance += amount
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
      service: it.service
        ? {
            id: it.service.connect.id,
            name: '',
            description: null,
            imageUrl: null,
            cost: 0,
            price: 0,
            unitId: 'unit-1',
          }
        : null,
      product: it.product
        ? {
            id: it.product.connect.id,
            name: '',
            description: null,
            imageUrl: null,
            quantity: 0,
            cost: 0,
            price: 0,
            unitId: 'unit-1',
          }
        : null,
      barber: it.barber
        ? {
            id: it.barber.connect.id,
            name: '',
            email: '',
            password: '',
            active: true,
            organizationId: 'org-1',
            unitId: 'unit-1',
            createdAt: new Date(),
            profile: {
              id: 'profile-' + it.barber.connect.id,
              phone: '',
              cpf: '',
              genre: '',
              birthday: '',
              pix: '',
              role: 'BARBER' as any,
              commissionPercentage: it.porcentagemBarbeiro ?? 100,
              totalBalance: 0,
              userId: it.barber.connect.id,
              createdAt: new Date(),
            },
          }
        : null,
      coupon: it.coupon
        ? {
            id: it.coupon.connect.id,
            code: '',
            description: null,
            discount: 0,
            discountType: DiscountType.VALUE,
            imageUrl: null,
            quantity: 0,
            unitId: 'unit-1',
            createdAt: new Date(),
          }
        : null,
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
      user: {
        id: (data.user as any).connect.id,
        name: '',
        email: '',
        password: '',
        active: true,
        organizationId: 'org-1',
        unitId: 'unit-1',
        createdAt: new Date(),
        profile: null,
      },
      client: {
        id: (data.client as any).connect.id,
        name: '',
        email: '',
        password: '',
        active: true,
        organizationId: 'org-1',
        unitId: 'unit-1',
        createdAt: new Date(),
        profile: null,
      },
      coupon: data.coupon
        ? {
            id: (data.coupon as any).connect.id,
            code: '',
            description: null,
            discount: 0,
            discountType: DiscountType.VALUE,
            imageUrl: null,
            quantity: 0,
            unitId: 'unit-1',
            createdAt: new Date(),
          }
        : null,
      session: null,
      transaction: data.transaction
        ? {
            id: (data.transaction as any).connect.id,
            userId: '',
            affectedUserId: null,
            unitId: '',
            cashRegisterSessionId: '',
            type: TransactionType.ADDITION,
            description: '',
            amount: data.total as number,
            createdAt: new Date(),
          }
        : null,
    }
    this.sales.push(sale)
    return sale
  }

  async findMany(where: Prisma.SaleWhereInput = {}): Promise<DetailedSale[]> {
    return this.sales.filter((s: any) => {
      if (where.unitId && s.unitId !== where.unitId) return false
      if (where.unit && 'organizationId' in (where.unit as any)) {
        return s.unit?.organizationId === (where.unit as any).organizationId
      }
      return true
    })
  }

  async findById(id: string): Promise<DetailedSale | null> {
    return this.sales.find((s) => s.id === id) ?? null
  }

  async update(id: string, data: Prisma.SaleUpdateInput): Promise<DetailedSale> {
    const sale = this.sales.find((s) => s.id === id)
    if (!sale) throw new Error('Sale not found')
    if (data.paymentStatus) {
      sale.paymentStatus = data.paymentStatus as PaymentStatus
    }
    if (data.session && 'connect' in data.session!) {
      const sid = (data.session as any).connect.id
      sale.sessionId = sid
      sale.session = {
        id: sid,
        openedById: '',
        unitId: sale.unitId,
        openedAt: new Date(),
        closedAt: null,
        initialAmount: 0,
        transactions: [],
        sales: [],
        finalAmount: null,
      }
    }
    if (data.transaction && 'connect' in data.transaction!) {
      const tid = (data.transaction as any).connect.id
      sale.transactionId = tid
      sale.transaction = {
        id: tid,
        userId: '',
        affectedUserId: null,
        unitId: sale.unitId,
        cashRegisterSessionId: sale.sessionId ?? '',
        type: TransactionType.ADDITION,
        description: '',
        amount: sale.total,
        createdAt: new Date(),
      }
    }
    return sale
  }

  async findManyByDateRange(start: Date, end: Date): Promise<DetailedSale[]> {
    return this.sales.filter(
      (s) => s.createdAt >= start && s.createdAt <= end,
    )
  }

  async findManyByUser(userId: string): Promise<DetailedSale[]> {
    return this.sales.filter((s) => s.userId === userId)
  }

  async findManyByBarber(barberId: string): Promise<DetailedSale[]> {
    return this.sales.filter((s) =>
      s.items.some((i) => i.barberId === barberId),
    )
  }

  async findManyBySession(sessionId: string): Promise<DetailedSale[]> {
    return this.sales.filter((s) => s.sessionId === sessionId)
  }
}

export class FakePasswordResetTokenRepository
  implements PasswordResetTokenRepository
{
  public tokens: PasswordResetToken[] = []

  async create(
    data: Prisma.PasswordResetTokenCreateInput,
  ): Promise<PasswordResetToken> {
    const token: PasswordResetToken = {
      id: randomUUID(),
      token: data.token as string,
      userId: (data.user as any).connect.id,
      expiresAt: data.expiresAt as Date,
    }
    this.tokens.push(token)
    return token
  }

  async findByToken(token: string): Promise<PasswordResetToken | null> {
    return this.tokens.find((t) => t.token === token) ?? null
  }

  async delete(id: string): Promise<void> {
    this.tokens = this.tokens.filter((t) => t.id !== id)
  }

  async deleteByUserId(userId: string): Promise<void> {
    this.tokens = this.tokens.filter((t) => t.userId !== userId)
  }
}
