import { Appointment, Prisma, Service, User } from "@prisma/client";

export type DetailedAppointment = Appointment & {
  service: Service
  client: User
  barber: User
}

export interface AppointmentRepository {
  create(data: Prisma.AppointmentCreateInput): Promise<Appointment>;
  findManyByUnit(unitId: string): Promise<DetailedAppointment[]>;
  findById(id: string): Promise<DetailedAppointment | null>;
}
