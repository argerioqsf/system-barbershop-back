import {
  PaymentMethod,
  PaymentStatus,
  SaleItem,
  Discount,
} from '@prisma/client'
import { DetailedSale } from '@/repositories/sale-repository'
import { OrganizationRepository } from '@/repositories/organization-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { UnitRepository } from '@/repositories/unit-repository'
import { TransactionRepository } from '@/repositories/transaction-repository'
import { AppointmentRepository } from '@/repositories/appointment-repository'
import { BarberServiceRepository } from '@/repositories/barber-service-repository'
import { AppointmentServiceRepository } from '@/repositories/appointment-service-repository'
import { BarberProductRepository } from '@/repositories/barber-product-repository'
import { SaleItemRepository } from '@/repositories/sale-item-repository'
import {
  ProductToUpdate,
  ReturnBuildItemData,
  SaleItemBuildItem,
} from './utils/item'

export interface DistributeProfitsDeps {
  organizationRepository: OrganizationRepository
  profileRepository: ProfilesRepository
  unitRepository: UnitRepository
  transactionRepository: TransactionRepository
  appointmentRepository: AppointmentRepository
  barberServiceRepository: BarberServiceRepository
  barberProductRepository: BarberProductRepository
  appointmentServiceRepository: AppointmentServiceRepository
  saleItemRepository: SaleItemRepository
}

export type CreateSaleItem = Partial<
  Pick<
    SaleItem,
    | 'serviceId'
    | 'productId'
    | 'appointmentId'
    | 'planId'
    | 'barberId'
    | 'couponId'
    | 'price'
    | 'customPrice'
  >
> & {
  id?: string
  quantity: number
}

export interface CreateSaleRequest {
  userId: string
  method?: PaymentMethod
  clientId: string
  observation?: string
}

export interface UpdateSaleRequest {
  id: string
  observation?: string
  method?: PaymentMethod
  paymentStatus?: PaymentStatus
  addItemsIds?: CreateSaleItem[]
  removeItemIds?: string[]
  couponId?: string
  clientId?: string
  removeCoupon?: boolean
  performedBy?: string
}

export type SaleItemUpdateFields = Omit<
  Partial<CreateSaleItem>,
  'id' | 'price'
> & { couponCode?: string | null }

export type UpdateSaleItemRequest = {
  saleItemUpdateFields: SaleItemUpdateFields
  id: string
}
export interface RemoveAddSaleItemRequest {
  id: string
  addItemsIds?: CreateSaleItem[]
  removeItemIds?: string[]
  performedBy?: string
}
export interface GetItemBuildRequest {
  saleItem: SaleItemBuildItem
  unitId: string
}

export interface GetItemBuildResponse {
  saleItemBuild: ReturnBuildItemData
  productsToUpdate: ProductToUpdate[]
}

export interface GetItemsBuildRequest {
  saleItems: SaleItemBuildItem[]
  unitId: string
}

export interface GetItemsBuildResponse {
  saleItemsBuild: ReturnBuildItemData[]
  newAppointmentsToLink: string[]
  productsToUpdate: ProductToUpdate[]
}

export interface CreateSaleResponse {
  sale: DetailedSale
}

export interface ConnectRelation {
  connect: { id: string }
}

export type DataItem = {
  quantity: number
  service?: { connect: { id: string } }
  product?: { connect: { id: string } }
  appointment?: { connect: { id: string } }
  plan?: { connect: { id: string } }
  categoryId: string | null
}

export type SaleItemTemp = Omit<
  SaleItem & {
    coupon?: { connect: { id: string } }
    service?: { connect: { id?: string } }
    product?: { connect: { id?: string } }
    barber?: { connect: { id: string } }
    appointment?: { connect: { id: string } }
    plan?: { connect: { id: string } }
    discounts?: { create: Discount[] }
  },
  | 'id'
  | 'saleId'
  | 'serviceId'
  | 'productId'
  | 'barberId'
  | 'couponId'
  | 'appointmentId'
  | 'planId'
  | 'planProfiles'
  | 'porcentagemBarbeiro'
  | 'commissionPaid'
>

export interface GetSaleRequest {
  id: string
}

export interface GetSaleResponse {
  sale: DetailedSale | null
}

export interface ListSalesResponse {
  sales: DetailedSale[]
}

export interface SetSaleStatusRequest {
  saleId: string
  userId: string
}

export interface SetSaleStatusResponse {
  sale: DetailedSale
}
