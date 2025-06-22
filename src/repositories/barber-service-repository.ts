import { BarberService, Prisma } from '@prisma/client'

export interface BarberServiceRepository {
  create(data: Prisma.BarberServiceUncheckedCreateInput): Promise<BarberService>
  findByProfileService(
    profileId: string,
    serviceId: string,
  ): Promise<BarberService | null>
}
