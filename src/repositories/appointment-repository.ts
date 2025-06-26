import {
  Appointment as PrismaAppointment,
  AppointmentService,
  Prisma,
  SaleItem,
  Service,
  User,
} from '@prisma/client'

export interface Appointment extends PrismaAppointment {
  value: number | null
  discount: number | null
}

export type AppointmentCreateInput = Prisma.AppointmentCreateInput & {
  value?: number | null
  discount?: number | null
}

export type AppointmentUpdateInput = Prisma.AppointmentUpdateInput & {
  value?: number | null
  discount?: number | null
}

export type DetailedAppointment = Appointment & {
  services: Service[]
  client: User
  barber: User
  saleItem?: SaleItem
}

export interface AppointmentRepository {
  create(
    data: AppointmentCreateInput,
    serviceIds: string[],
  ): Promise<Appointment>
  findManyByUnit(unitId: string): Promise<DetailedAppointment[]>
  findMany(where?: Prisma.AppointmentWhereInput): Promise<DetailedAppointment[]>
  findById(id: string): Promise<DetailedAppointment | null>
  update(id: string, data: AppointmentUpdateInput): Promise<Appointment>
}
