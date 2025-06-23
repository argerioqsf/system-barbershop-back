import { BarberServiceRepository } from '../barber-service-repository'
import { BarberService, Prisma } from '@prisma/client'
import { randomUUID } from 'crypto'

export class InMemoryBarberServiceRepository
  implements BarberServiceRepository
{
  constructor(public items: BarberService[] = []) {}

  async create(
    data: Prisma.BarberServiceUncheckedCreateInput,
  ): Promise<BarberService> {
    const item: BarberService = {
      id: randomUUID(),
      profileId: data.profileId,
      serviceId: data.serviceId,
      time: data.time ?? null,
      commissionPercentage: data.commissionPercentage ?? null,
      commissionType: data.commissionType ?? 'PERCENTAGE_OF_ITEM',
    }
    this.items.push(item)
    return item
  }

  async findByProfileService(
    profileId: string,
    serviceId: string,
  ): Promise<BarberService | null> {
    return (
      this.items.find(
        (i) => i.profileId === profileId && i.serviceId === serviceId,
      ) ?? null
    )
  }
}
