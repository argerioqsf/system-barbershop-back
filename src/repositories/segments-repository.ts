import { Course, Prisma, Segment } from '@prisma/client'

export interface SegmentsRepository {
  create(data: Prisma.SegmentUncheckedCreateInput): Promise<Segment>
  findMany(page: number, query?: string): Promise<Segment[]>
  count(query?: string): Promise<number>
  mountSelect(): Promise<Segment[]>
  findManyListIds(ids: string[]): Promise<Segment[]>
  findById(
    id: string,
  ): Promise<(Segment & { courses: { course: Course }[] }) | null>
  deleteById(id: string): Promise<Segment | null>
  updateById(id: string, data: Prisma.SegmentUpdateInput): Promise<Segment>
}
