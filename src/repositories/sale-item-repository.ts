import {
  Appointment,
  AppointmentService,
  Discount,
  Prisma,
  Product,
  Sale,
  SaleItem,
  Service,
  Transaction,
} from '@prisma/client'

export type DetailedAppointmentService = AppointmentService & {
  service: Service
  transactions: Transaction[]
}

export type DetailedSaleItemFindMany = SaleItem & {
  sale: Sale
  transactions: Transaction[]
  appointment?:
    | (Appointment & {
        services: DetailedAppointmentService[]
      })
    | null
  discounts: Discount[]
}

export type DetailedSaleItemFindById = SaleItem & {
  sale: Sale
  transactions: Transaction[]
  discounts: Discount[]
  appointment?:
    | (Appointment & {
        services: DetailedAppointmentService[]
      })
    | null
}

export type ReturnFindManyPendingCommission = SaleItem & {
  sale: Sale
  transactions: Transaction[]
  discounts: Discount[]
  appointment?:
    | (Appointment & {
        services: DetailedAppointmentService[]
      })
    | null
  service: Service | null
  product: Product | null
}

export interface SaleItemRepository {
  update(
    id: string,
    data: Prisma.SaleItemUpdateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<SaleItem>
  updateManyIndividually(
    updates: { id: string; data: Prisma.SaleItemUpdateInput }[],
    tx?: Prisma.TransactionClient,
  ): Promise<SaleItem[]>
  findById(id: string): Promise<DetailedSaleItemFindById | null>
  findMany(
    where?: Prisma.SaleItemWhereInput,
  ): Promise<DetailedSaleItemFindMany[]>

  findManyPendingCommissionForIds(
    barberId: string,
    appointmentServiceIds?: string[],
    saleItemIds?: string[],
  ): Promise<ReturnFindManyPendingCommission[]>

  findManyByBarberId(barberId: string): Promise<DetailedSaleItemFindMany[]>

  findManyPendingCommission(
    barberId: string,
  ): Promise<ReturnFindManyPendingCommission[]>
}
