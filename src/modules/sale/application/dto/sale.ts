import {
  PaymentMethod,
  PaymentStatus,
  PermissionName,
  RoleName,
  SaleItem,
  Discount,
} from '@prisma/client'

import { DetailedSale } from '@/modules/sale/application/ports/sale-repository'
import {
  ProductToUpdate,
  ReturnBuildItemData,
  SaleItemBuildItem,
} from './sale-item-dto'
import { OrganizationRepository } from '@/repositories/organization-repository'
import { ProfilesRepository } from '@/modules/sale/application/ports/profiles-repository'
import { UnitRepository } from '@/repositories/unit-repository'
import { TransactionRepository } from '@/repositories/transaction-repository'
import { AppointmentRepository } from '@/modules/sale/application/ports/appointment-repository'
import { BarberServiceRepository } from '@/repositories/barber-service-repository'
import { AppointmentServiceRepository } from '@/repositories/appointment-service-repository'
import { BarberProductRepository } from '@/repositories/barber-product-repository'
import { SaleItemRepository } from '@/modules/sale/application/ports/sale-item-repository'

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

export interface CreateSaleResponse {
  sale: DetailedSale
}

export interface UpdateSaleRequest {
  id: string
  observation?: string
  method?: PaymentMethod
  paymentStatus?: PaymentStatus
  addItems?: CreateSaleItem[]
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
  addItems?: CreateSaleItem[]
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

export interface ConnectRelation {
  connect: { id: string }
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

export interface ListSalesActor {
  id: string
  unitId: string
  organizationId: string
  role: RoleName
  permissions?: PermissionName[]
}

export interface GetSaleRequest {
  id: string
  actor: ListSalesActor
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
