import {
  Appointment,
  Coupon,
  Discount,
  Plan,
  Product,
  Service,
} from '@prisma/client'

import { UserFindById } from '@/modules/sale/application/ports/barber-users-repository'

export type ProductToUpdate = {
  id: string
  quantity: number
  saleItemId: string
}

export type NewDiscount = Omit<Discount, 'id' | 'saleItemId'>

export type SaleItemBuildItem = {
  saleId: string
  id?: string
  serviceId?: string
  productId?: string
  appointmentId?: string
  planId?: string
  barberId?: string
  couponId?: string
  quantity: number
  price?: number
  customPrice?: number | null
}

export type ReturnBuildItemData = {
  id?: string
  coupon?: Coupon | null
  quantity: number
  service?: Service | null
  product?: Product | null
  plan?: Plan | null
  barber?: UserFindById | null
  price: number
  basePrice: number
  customPrice?: number | null
  discounts: NewDiscount[]
  appointment?: Appointment | null
  commissionPaid: boolean
}

export type SaleItemWithDiscounts = SaleItemBuildItem & {
  discounts: NewDiscount[]
}
