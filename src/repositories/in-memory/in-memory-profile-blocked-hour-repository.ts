import { Prisma, ProfileBlockedHour } from '@prisma/client'
import { ProfileBlockedHourRepository } from '../profile-blocked-hour-repository'
import { randomUUID } from 'crypto'

export class InMemoryProfileBlockedHourRepository
  implements ProfileBlockedHourRepository
{
  constructor(public items: ProfileBlockedHour[] = []) {}

  async create(
    data: Prisma.ProfileBlockedHourUncheckedCreateInput,
  ): Promise<ProfileBlockedHour> {
    const item: ProfileBlockedHour = {
      id: randomUUID(),
      profileId: data.profileId,
      dayHourId: data.dayHourId,
    }
    this.items.push(item)
    return item
  }

  async findManyByProfile(profileId: string): Promise<ProfileBlockedHour[]> {
    return this.items.filter((i) => i.profileId === profileId)
  }
}
