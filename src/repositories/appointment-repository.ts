import {
  Appointment,
  AppointmentService,
  Prisma,
  SaleItem,
  Service,
  User,
} from '@prisma/client'

export type DetailedAppointment = Appointment & {
  services: AppointmentService & { service: Service }[]
  client: User
  barber: User
  saleItem?: SaleItem
}

export interface AppointmentRepository {
  create(
    data: Prisma.AppointmentCreateInput,
    serviceIds: string[],
  ): Promise<Appointment>
  findManyByUnit(unitId: string): Promise<DetailedAppointment[]>
  findMany(where?: Prisma.AppointmentWhereInput): Promise<DetailedAppointment[]>
  findById(id: string): Promise<DetailedAppointment | null>
  update(id: string, data: Prisma.AppointmentUpdateInput): Promise<Appointment>
}
