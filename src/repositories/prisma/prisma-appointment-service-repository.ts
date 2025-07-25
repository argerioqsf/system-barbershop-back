import { prisma } from '@/lib/prisma'
import { Prisma, AppointmentService } from '@prisma/client'
import { AppointmentServiceRepository } from '../appointment-service-repository'

export class PrismaAppointmentServiceRepository
  implements AppointmentServiceRepository
{
  async update(
    id: string,
    data: Prisma.AppointmentServiceUpdateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<AppointmentService> {
    const prismaClient = tx || prisma
    return prismaClient.appointmentService.update({ where: { id }, data })
  }
}
