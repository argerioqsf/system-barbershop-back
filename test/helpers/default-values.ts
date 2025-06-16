import { DiscountType, Service, Product, Coupon } from '@prisma/client'

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
