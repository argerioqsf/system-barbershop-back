import { prisma } from '@/lib/prisma'
import { Prisma, BarberService } from '@prisma/client'
import { BarberServiceRepository } from '../barber-service-repository'

export class PrismaBarberServiceRepository implements BarberServiceRepository {
  async create(
    data: Prisma.BarberServiceUncheckedCreateInput,
  ): Promise<BarberService> {
    return prisma.barberService.create({ data })
  }

  async findByProfileService(
    profileId: string,
    serviceId: string,
  ): Promise<BarberService | null> {
    return prisma.barberService.findUnique({
      where: { profileId_serviceId: { profileId, serviceId } },
    })
  }
}
