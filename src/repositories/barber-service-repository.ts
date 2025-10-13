import { BarberService, Prisma } from '@prisma/client'

export interface BarberServiceRepository {
  create(data: Prisma.BarberServiceUncheckedCreateInput): Promise<BarberService>
  findByProfileService(
    profileId: string,
    serviceId: string,
  ): Promise<BarberService | null>
  update(
    profileId: string,
    serviceId: string,
    data: Prisma.BarberServiceUncheckedUpdateInput,
  ): Promise<BarberService>
  deleteByProfileService(profileId: string, serviceId: string): Promise<void>
}
