import {
  Appointment,
  Prisma,
  SaleItem,
  User,
  Profile,
  AppointmentService,
  Service,
  Transaction,
} from '@prisma/client'

export type DetailedAppointmentService = AppointmentService & {
  service: Service
  transactions: Transaction[]
}

export type DetailedAppointment = Appointment & {
  services: DetailedAppointmentService[]
  client: User
  barber: User & { profile: Profile | null }
  saleItem?: SaleItem | null
}

export interface AppointmentRepository {
  create(
    data: Prisma.AppointmentCreateInput,
    services: Service[],
  ): Promise<Appointment>
  findManyByUnit(unitId: string): Promise<DetailedAppointment[]>
  findMany(where?: Prisma.AppointmentWhereInput): Promise<DetailedAppointment[]>
  findById(id: string): Promise<DetailedAppointment | null>
  update(id: string, data: Prisma.AppointmentUpdateInput): Promise<Appointment>
}
