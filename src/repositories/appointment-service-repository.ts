import { AppointmentService, Prisma } from '@prisma/client'

export interface AppointmentServiceRepository {
  update(
    id: string,
    data: Prisma.AppointmentServiceUpdateInput,
  ): Promise<AppointmentService>
}
