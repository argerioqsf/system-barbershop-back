import { Prisma, DayHour } from '@prisma/client'

export interface DayHourRepository {
  create(data: Prisma.DayHourCreateInput): Promise<DayHour>
  findMany(where?: Prisma.DayHourWhereInput): Promise<DayHour[]>
}
