import {
  Appointment,
  AppointmentService,
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

export interface SaleItemRepository {
  update(id: string, data: Prisma.SaleItemUpdateInput): Promise<SaleItem>
  findMany(
    where?: Prisma.SaleItemWhereInput,
  ): Promise<DetailedSaleItemFindMany[]>

  findManyFilterAppointmentService(
    where?: Prisma.SaleItemWhereInput,
    appointmentServiceIds?: string[],
  ): Promise<DetailedSaleItemFindMany[]>
}
