import {
  DiscountType,
  Service,
  Product,
  Coupon,
  Organization,
  Unit,
  Profile,
  User,
  PaymentMethod,
  PaymentStatus,
  TransactionType,
  Sale,
  Permission,
  RoleModel,
} from '@prisma/client'

export const defaultUser = {
  id: 'user-1',
  name: '',
  email: '',
  password: '',
  active: true,
  organizationId: 'org-1',
  unitId: 'unit-1',
  createdAt: new Date(),
  profile: null,
}

export const defaulSale: Sale = {
  id: 'user-1',
  unitId: 'unit-1',
  createdAt: new Date(),
  userId: 'user-1',
  clientId: 'client-1',
  sessionId: 's1',
  couponId: null,
  total: 20,
  method: 'CASH',
  paymentStatus: 'PAID',
}

export const defaultClient = {
  id: 'client-1',
  name: '',
  email: '',
  password: '',
  active: true,
  organizationId: 'org-1',
  unitId: 'unit-1',
  createdAt: new Date(),
  profile: null,
}

export const barberProfile = {
  id: 'profile-barber',
  phone: '',
  cpf: '',
  genre: '',
  birthday: '',
  pix: '',
  role: 'BARBER' as any,
  commissionPercentage: 50,
  roleModelId: 'role-1',
  totalBalance: 0,
  userId: 'barber-1',
  createdAt: new Date(),
}

export const barberUser = {
  id: 'barber-1',
  name: '',
  email: '',
  password: '',
  active: true,
  organizationId: 'org-1',
  unitId: 'unit-1',
  createdAt: new Date(),
  profile: barberProfile,
}

export function makeService(id: string, price = 100): Service {
  return {
    id,
    name: '',
    description: null,
    imageUrl: null,
    cost: 0,
    price,
    unitId: 'unit-1',
  }
}

export function makeProduct(id: string, price = 50, quantity = 5): Product {
  return {
    id,
    name: '',
    description: null,
    imageUrl: null,
    quantity,
    cost: 0,
    price,
    unitId: 'unit-1',
  }
}

export function makeCoupon(
  id: string,
  code: string,
  discount: number,
  type: DiscountType,
): Coupon {
  return {
    id,
    code,
    description: null,
    discount,
    discountType: type,
    imageUrl: null,
    quantity: 5,
    unitId: 'unit-1',
    createdAt: new Date(),
  }
}

export const defaultOrganization: Organization = {
  id: 'org-1',
  name: 'Org',
  slug: 'org',
  totalBalance: 0,
  createdAt: new Date(),
}

export const defaultUnit: Unit = {
  id: 'unit-1',
  name: 'Unit',
  slug: 'unit',
  organizationId: 'org-1',
  totalBalance: 0,
  allowsLoan: false,
}

export const defaultProfile: Profile = {
  id: 'profile-user',
  phone: '',
  cpf: '',
  genre: '',
  birthday: '',
  pix: '',
  role: 'BARBER' as any,
  roleModelId: 'role-1',
  commissionPercentage: 100,
  totalBalance: 0,
  userId: defaultUser.id,
  createdAt: new Date(),
}

export function makeProfile(
  id: string,
  userId: string,
  balance = 0,
): Profile & { user: Omit<User, 'password'> } {
  return {
    id,
    phone: '',
    cpf: '',
    genre: '',
    birthday: '',
    pix: '',
    role: 'BARBER' as any,
    roleModelId: 'role-1',
    commissionPercentage: 100,
    totalBalance: balance,
    userId,
    user: { ...defaultUser, id: userId },
    createdAt: new Date(),
  }
}

export function makeUser(
  id: string,
  profile: Profile,
  unit: Unit,
): User & { profile: Profile; unit: Unit } {
  return { ...defaultUser, id, profile, unit }
}
export function makeOrganization(
  id: string,
  name = 'Org',
  slug = 'org',
): Organization {
  return {
    id,
    name,
    slug,
    totalBalance: 0,
    createdAt: new Date(),
  }
}

export function makeUnit(
  id: string,
  name = 'Unit',
  slug = 'unit',
  organizationId = 'org-1',
): Unit {
  return { id, name, slug, organizationId, totalBalance: 0, allowsLoan: false }
}

export function makeSale(
  id: string,
  unitId = 'unit-1',
  organizationId = 'org-1',
  status: PaymentStatus = PaymentStatus.PENDING,
  total = 100,
): any {
  return {
    id,
    userId: 'u1',
    clientId: 'c1',
    unitId,
    total,
    method: 'CASH' as PaymentMethod,
    paymentStatus: status,
    createdAt: new Date(),
    items: [],
    user: {},
    client: {},
    coupon: null,
    session: null,
    transactions: [],
    unit: { organizationId },
  } as any
}

export function makeSaleWithBarber(): any {
  return {
    id: 'sale-1',
    userId: 'cashier',
    clientId: 'c1',
    unitId: defaultUnit.id,
    total: 100,
    method: 'CASH' as PaymentMethod,
    paymentStatus: PaymentStatus.PENDING,
    createdAt: new Date(),
    items: [
      {
        id: 'i1',
        saleId: 'sale-1',
        serviceId: null,
        productId: null,
        quantity: 1,
        barberId: barberUser.id,
        couponId: null,
        price: 100,
        discount: null,
        discountType: null,
        porcentagemBarbeiro: barberProfile.commissionPercentage,
        service: null,
        product: null,
        barber: { ...barberUser, profile: barberProfile },
        coupon: null,
      },
    ],
    user: { ...defaultUser },
    client: { ...defaultUser },
    coupon: null,
    session: null,
    transactions: [],
  } as any
}

export function makeBalanceSale(barberId: string = barberUser.id): any {
  return {
    items: [
      {
        barberId,
        price: 100,
        porcentagemBarbeiro: 50,
        productId: null,
        service: { name: 'Cut' },
        quantity: 1,
        coupon: null,
      },
    ],
    coupon: null,
  }
}

export function makeTransaction(over: any = {}): any {
  return {
    id: over.id ?? 't1',
    userId: over.userId ?? 'u1',
    affectedUserId: null,
    unitId: over.unitId ?? 'unit-1',
    cashRegisterSessionId: 's1',
    type: over.type ?? TransactionType.ADDITION,
    description: '',
    amount: over.amount ?? 10,
    isLoan: over.isLoan ?? false,
    receiptUrl: over.receiptUrl ?? null,
    createdAt: new Date(),
    unit: { organizationId: over.organizationId ?? 'org-1' },
    sale: over.sale ?? null,
  }
}

export const namedUser = {
  id: 'user-1',
  name: 'John',
  email: 'john@example.com',
  password: '123',
  active: true,
  organizationId: 'org-1',
  unitId: 'unit-1',
  createdAt: new Date(),
  profile: null,
}

export const sessionUser = { sub: 'u1', unitId: 'unit-1' } as any

export function makeCashSession(
  id: string,
  unitId = 'unit-1',
  organizationId = 'org-1',
): any {
  return {
    id,
    openedById: 'u1',
    unitId,
    openedAt: new Date(),
    closedAt: null,
    initialAmount: 0,
    finalAmount: null,
    user: {},
    sales: [],
    transactions: [],
    unit: { organizationId },
  } as any
}

export const baseRegisterUserData = {
  name: 'John',
  email: 'j@e.com',
  password: '123',
  phone: '1',
  cpf: '2',
  genre: 'M',
  birthday: '2000',
  pix: 'x',
  role: 'BARBER' as any,
  roleModelId: 'role-1',
}

export const listUser1 = {
  id: 'u1',
  email: 'a@a.com',
  profile: null,
  unit: { id: 'unit-1', organizationId: 'org-1' },
  organizationId: 'org-1',
} as any

export const listUser2 = {
  id: 'u2',
  email: 'b@b.com',
  profile: null,
  unit: { id: 'unit-2', organizationId: 'org-2' },
  organizationId: 'org-2',
} as any

export const session1 = {
  id: 's1',
  openedById: 'u1',
  unitId: 'unit-1',
  openedAt: new Date(),
  closedAt: null,
  initialAmount: 0,
  finalAmount: null,
  user: {},
  sales: [],
  transactions: [],
  unit: { organizationId: 'org-1' },
} as any

export const session2 = {
  id: 's2',
  openedById: 'u2',
  unitId: 'unit-2',
  openedAt: new Date(),
  closedAt: null,
  initialAmount: 0,
  finalAmount: null,
  user: {},
  sales: [],
  transactions: [],
  unit: { organizationId: 'org-2' },
} as any

export const appointment1 = {
  id: 'a1',
  unitId: 'unit-1',
  service: {},
  client: {},
  barber: {},
  date: new Date(),
  hour: '10',
  unit: { organizationId: 'org-1' },
} as any

export const appointment2 = {
  id: 'a2',
  unitId: 'unit-2',
  service: {},
  client: {},
  barber: {},
  date: new Date(),
  hour: '11',
  unit: { organizationId: 'org-2' },
} as any

export function makeRoleModel(id = 'role-1', unitId = 'unit-1'): RoleModel {
  return { id, name: 'Role', unitId }
}

export function makePermission(
  id = 'perm-1',
  unitId = 'unit-1',
): Permission {
  return { id, action: 'action', category: 'general', unitId }
}
