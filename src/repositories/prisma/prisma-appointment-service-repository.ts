import { prisma } from '@/lib/prisma'
import { Prisma, AppointmentService } from '@prisma/client'
import { AppointmentServiceRepository } from '../appointment-service-repository'

export class PrismaAppointmentServiceRepository
  implements AppointmentServiceRepository
{
  async update(
    id: string,
    data: Prisma.AppointmentUpdateInput,
  ): Promise<AppointmentService> {
    return prisma.appointmentService.update({ where: { id }, data })
  }
}
