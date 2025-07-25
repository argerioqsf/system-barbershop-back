import {
  Appointment,
  AppointmentService,
  Discount,
  Prisma,
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

  findManyFilterAppointmentService(
    where?: Prisma.SaleItemWhereInput,
    appointmentServiceIds?: string[],
  ): Promise<DetailedSaleItemFindMany[]>
}
