import { Course, Prisma, Segment, Unit } from '@prisma/client'

export interface UnitRepository {
  create(data: Prisma.UnitCreateInput): Promise<Unit>
  findMany(page: number, query?: string): Promise<Unit[]>
  count(query?: string): Promise<number>
  findById(id: string): Promise<
    | (Unit & {
        courses: { course: Course }[]
        segments: { segment: Segment }[]
      })
    | null
  >
  deleteById(id: string): Promise<Unit | null>
  updateById(id: string, data: Prisma.UnitUpdateInput): Promise<Unit>
  findManyListIds(ids: string[]): Promise<Unit[]>
  mountSelect(): Promise<Unit[]>
}
