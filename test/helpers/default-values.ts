import {
  DiscountType,
  Service,
  Product,
  Coupon,
  Organization,
  Unit,
  Profile,
  User,
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
  ownerId: null,
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
