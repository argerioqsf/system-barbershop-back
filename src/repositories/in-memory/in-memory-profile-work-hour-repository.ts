import { Prisma, ProfileWorkHour } from '@prisma/client'
import { ProfileWorkHourRepository } from '../profile-work-hour-repository'
import { randomUUID } from 'crypto'

export class InMemoryProfileWorkHourRepository
  implements ProfileWorkHourRepository
{
  constructor(public items: ProfileWorkHour[] = []) {}

  async create(
    data: Prisma.ProfileWorkHourUncheckedCreateInput,
  ): Promise<ProfileWorkHour> {
    const item: ProfileWorkHour = {
      id: randomUUID(),
      profileId: data.profileId,
      weekDay: data.weekDay,
      startHour: data.startHour,
      endHour: data.endHour,
    }
    this.items.push(item)
    return item
  }

  async findById(id: string): Promise<ProfileWorkHour | null> {
    return this.items.find((i) => i.id === id) ?? null
  }

  async findManyByProfile(
    profileId: string,
    weekDay?: number,
  ): Promise<ProfileWorkHour[]> {
    return this.items.filter(
      (i) =>
        i.profileId === profileId &&
        (weekDay === undefined || i.weekDay === weekDay),
    )
  }

  async delete(id: string): Promise<void> {
    this.items = this.items.filter((i) => i.id !== id)
  }
}
