import { Appointment, Prisma } from '@prisma/client'

export interface AppointmentRepository {
  create(data: Prisma.AppointmentCreateInput): Promise<Appointment>
  findMany(): Promise<Appointment[]>
  findById(id: string): Promise<Appointment | null>
}
