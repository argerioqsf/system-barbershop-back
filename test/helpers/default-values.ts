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
  Permission,
  Role,
  BarberService,
  CommissionCalcType,
  PermissionName,
  ProfileWorkHour,
  ProfileBlockedHour,
  RoleName,
} from '@prisma/client'
import { TransactionFull } from '../../src/repositories/prisma/prisma-transaction-repository'
import { DetailedSale } from '../../src/repositories/sale-repository'

export const defaultUser = {
  id: 'user-1',
  name: '',
  email: '',
  password: '',
  active: true,
  organizationId: 'org-1',
  unitId: 'unit-1',
  versionToken: 1,
  versionTokenInvalidate: null,
  createdAt: new Date(),
  profile: null,
  unit: null,
}

export const defaultSale: DetailedSale = {
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
  observation: '',
  user: {
    ...defaultUser,
    id: 'user-1',
    name: 'Cliente Teste',
    email: 'cliente@exemplo.com',
    profile: {
      id: 'profile-1',
      phone: '11999999999',
      cpf: '00000000000',
      genre: 'M',
      birthday: '2000-01-01',
      pix: '00000000000',
      roleId: 'role-1',
      commissionPercentage: 0,
      totalBalance: 0,
      userId: 'user-1',
      createdAt: new Date(),
    },
  },
  client: defaultUser,
  session: null,
  items: [
    {
      id: 'i1',
      saleId: 'sale-1',
      serviceId: null,
      productId: null,
      quantity: 1,
      barberId: 'user-barber',
      couponId: null,
      price: 100,
      discount: null,
      discountType: null,
      porcentagemBarbeiro: 0,
      service: null,
      product: null,
      barber: defaultUser,
      coupon: null,
      appointmentId: 'ap-1',
      appointment: null,
    },
  ],
  coupon: null,
  transactions: [],
}

export const defaultClient = {
  id: 'client-1',
  name: '',
  email: '',
  password: '',
  active: true,
  organizationId: 'org-1',
  unitId: 'unit-1',
  versionToken: 1,
  versionTokenInvalidate: null,
  createdAt: new Date(),
  profile: null,
}

const p1 = makePermission('p1', PermissionName.SELL_SERVICE)
const p2 = makePermission('p1', PermissionName.SELL_APPOINTMENT)
const r1 = makeRole()
export const barberProfile: Profile & {
  permissions: Permission[]
  workHours: ProfileWorkHour[]
  blockedHours: ProfileBlockedHour[]
  barberServices: BarberService[]
  role: Role
} = {
  id: 'profile-barber',
  phone: '',
  cpf: '',
  genre: '',
  birthday: '',
  pix: '',
  commissionPercentage: 50,
  roleId: 'role-1',
  totalBalance: 0,
  userId: 'barber-1',
  createdAt: new Date(),
  permissions: [p1, p2],
  workHours: [],
  blockedHours: [],
  barberServices: [],
  role: r1,
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
  versionToken: 1,
  versionTokenInvalidate: 0,
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
    category: null,
    defaultTime: null,
    commissionPercentage: null,
    unitId: 'unit-1',
  }
}

export function makeBarberServiceRel(
  profileId: string,
  serviceId: string,
  type: CommissionCalcType = CommissionCalcType.PERCENTAGE_OF_ITEM,
  commission?: number,
  time?: number | null,
): BarberService {
  return {
    id: `rel-${profileId}-${serviceId}`,
    profileId,
    serviceId,
    time: time ?? null,
    commissionPercentage: commission ?? null,
    commissionType: type,
  }
}

export function makeBarberProductRel(
  profileId: string,
  productId: string,
  type: CommissionCalcType = CommissionCalcType.PERCENTAGE_OF_USER,
  commission?: number,
) {
  return {
    id: `rel-prod-${profileId}-${productId}`,
    profileId,
    productId,
    commissionPercentage: commission ?? null,
    commissionType: type,
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
    commissionPercentage: 0,
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
  slotDuration: 30,
}

export const defaultProfile: Profile & {
  role: Role
  permissions: Permission[]
  workHours: ProfileWorkHour[]
  blockedHours: ProfileBlockedHour[]
  barberServices: BarberService[]
} = {
  id: 'profile-user',
  phone: '',
  cpf: '',
  genre: '',
  birthday: '',
  pix: '',
  roleId: 'role-1',
  commissionPercentage: 100,
  totalBalance: 0,
  userId: defaultUser.id,
  createdAt: new Date(),
  permissions: [p1],
  workHours: [],
  blockedHours: [],
  barberServices: [],
  role: {
    id: 'rl-1',
    name: RoleName.ADMIN,
    unitId: 'unit1',
  },
}

export function makeProfile(
  id: string,
  userId: string,
  balance = 0,
): Profile & {
  user: Omit<User, 'password'>
  role: Role
  permissions: Permission[]
  workHours: ProfileWorkHour[]
  blockedHours: ProfileBlockedHour[]
  barberServices: BarberService[]
} {
  return {
    id,
    phone: '',
    cpf: '',
    genre: '',
    birthday: '',
    pix: '',
    roleId: 'role-1',
    commissionPercentage: 100,
    totalBalance: balance,
    userId,
    user: { ...defaultUser, id: userId },
    createdAt: new Date(),
    permissions: [],
    workHours: [],
    blockedHours: [],
    barberServices: [],
    role: {
      id: 'rl-1',
      name: RoleName.ADMIN,
      unitId: 'unit-1',
    },
  }
}

export function makeUser(
  id: string,
  profile: Profile & {
    role: Role
    permissions: Permission[]
    workHours: ProfileWorkHour[]
    blockedHours: ProfileBlockedHour[]
    barberServices: BarberService[]
  },
  unit: Unit,
): User & {
  profile: Profile & {
    role: Role
    permissions: Permission[]
    workHours: ProfileWorkHour[]
    blockedHours: ProfileBlockedHour[]
    barberServices: BarberService[]
  }
  unit: Unit
} {
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
  return {
    id,
    name,
    slug,
    organizationId,
    totalBalance: 0,
    allowsLoan: false,
    slotDuration: 30,
  }
}

export function makeSale(
  id: string,
  unitId = 'unit-1',
  organizationId = 'org-1',
  status: PaymentStatus = PaymentStatus.PENDING,
  total = 100,
): DetailedSale & { unit: Unit } {
  return {
    ...defaultSale,
    items: [],
    id,
    unitId,
    paymentStatus: status,
    total,
    unit: { ...defaultUnit, organizationId },
  }
}

export function makeSaleWithBarber(): DetailedSale {
  return {
    id: 'sale-1',
    userId: 'cashier',
    clientId: 'c1',
    unitId: defaultUnit.id,
    total: 100,
    method: 'CASH' as PaymentMethod,
    paymentStatus: PaymentStatus.PENDING,
    createdAt: new Date(),
    observation: null,
    couponId: null,
    sessionId: null,
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
        appointmentId: null,
        appointment: null,
      },
    ],
    user: { ...defaultUser },
    client: { ...defaultUser },
    coupon: null,
    session: null,
    transactions: [],
  }
}

export function makeBalanceSale(
  barberId: string = barberUser.id,
): TransactionFull['sale'] {
  return {
    ...defaultSale,
    items: [
      {
        ...defaultSale.items[0],
        barberId,
      },
    ],
    coupon: null,
    user: defaultUser,
  }
}

export function makeTransaction(
  over: TransactionFull & {
    organizationId?: string
  },
): TransactionFull & { unit: { organizationId: string } } {
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
    saleId: 'sl-1',
  }
}

export const namedUser: User & {
  profile:
    | (Profile & {
        permissions: Permission[]
        role: Role
        workHours: ProfileWorkHour[]
        blockedHours: ProfileBlockedHour[]
        barberServices: BarberService[]
      })
    | null
} = {
  id: 'user-1',
  name: 'John',
  email: 'john@example.com',
  password: '123',
  active: true,
  organizationId: 'org-1',
  unitId: 'unit-1',
  createdAt: new Date(),
  profile: null,
  versionToken: 1,
  versionTokenInvalidate: 0,
}

export const sessionUser = { sub: 'u1', unitId: 'unit-1' }

export function makeCashSession(
  id: string,
  unitId = 'unit-1',
  organizationId = 'org-1',
) {
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
  }
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
  roleId: 'role-1',
}

export const listUser1: User & {
  unit?: Unit
  profile: Profile & {
    user: Omit<User, 'password'>
    role: Role
    permissions: Permission[]
    workHours: ProfileWorkHour[]
    blockedHours: ProfileBlockedHour[]
    barberServices: BarberService[]
  }
} = {
  ...defaultUser,
  id: 'u1',
  email: 'a@a.com',
  profile: makeProfile('p-u1', 'u1'),
  unit: { ...defaultUnit, id: 'unit-1', organizationId: 'org-1' },
  organizationId: 'org-1',
}

export const listUser2: User & {
  unit?: Unit
  profile: Profile & {
    user: Omit<User, 'password'>
    role: Role
    permissions: Permission[]
    workHours: ProfileWorkHour[]
    blockedHours: ProfileBlockedHour[]
    barberServices: BarberService[]
  }
} = {
  ...defaultUser,
  id: 'u2',
  email: 'b@b.com',
  profile: makeProfile('p-u2', 'u2'),
  unit: { ...defaultUnit, id: 'unit-2', organizationId: 'org-2' },
  organizationId: 'org-2',
}

export const session1 = {
  id: 's1',
  openedById: 'u1',
  unitId: 'unit-1',
  openedAt: new Date(),
  closedAt: null,
  initialAmount: 0,
  finalAmount: null,
  sales: [],
  transactions: [],
  unit: { organizationId: 'org-1' },
  user: defaultUser,
}

export const session2 = {
  id: 's2',
  openedById: 'u2',
  unitId: 'unit-2',
  openedAt: new Date(),
  closedAt: null,
  initialAmount: 0,
  finalAmount: null,
  sales: [],
  transactions: [],
  unit: { organizationId: 'org-2' },
  user: defaultUser,
}

export const appointment1 = {
  id: 'a1',
  unitId: 'unit-1',
  services: [],
  client: {},
  barber: {},
  date: new Date(),
  status: 'SCHEDULED',
  durationService: null,
  discount: 0,
  value: null,
  unit: { organizationId: 'org-1' },
}

export const appointment2 = {
  id: 'a2',
  unitId: 'unit-2',
  services: [],
  client: {},
  barber: {},
  date: new Date(),
  status: 'SCHEDULED',
  durationService: null,
  discount: 0,
  value: null,
  unit: { organizationId: 'org-2' },
}

export function makeRole(id = 'role-1', unitId = 'unit-1'): Role {
  return { id, name: 'ADMIN', unitId }
}

export function makePermission(
  id = 'perm-1',
  name?: PermissionName,
): Permission {
  return {
    id,
    name: name ?? PermissionName.LIST_APPOINTMENTS_UNIT,
    category: 'UNIT',
  }
}

export function makeServiceWithCommission(
  id: string,
  price: number,
  commissionPercentage: number,
): Service {
  return { ...makeService(id, price), commissionPercentage }
}

export function makeAppointment(
  id: string,
  service: Service,
  options: {
    date?: Date
    durationService?: number | null
    status?: string
  } = {},
) {
  return {
    id,
    clientId: defaultClient.id,
    barberId: barberUser.id,
    unitId: defaultUnit.id,
    date: options.date ?? new Date(),
    status: (options.status as any) ?? 'SCHEDULED',
    durationService: options.durationService ?? null,
    observation: null,
    services: [service],
    client: defaultClient,
    barber: barberUser,
    unit: { organizationId: defaultOrganization.id },
  }
}
