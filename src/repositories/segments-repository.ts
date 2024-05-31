import { Course, Prisma, Segment } from '@prisma/client'

export interface SegmentsRepository {
  create(data: Prisma.SegmentUncheckedCreateInput): Promise<Segment>
  findMany(page: number, where: Prisma.SegmentWhereInput): Promise<Segment[]>
  count(where: Prisma.SegmentWhereInput): Promise<number>
  mountSelect(): Promise<Segment[]>
  findManyListIds(ids: string[]): Promise<Segment[]>
  findById(
    id: string,
  ): Promise<(Segment & { courses: { course: Course }[] }) | null>
  deleteById(id: string): Promise<Segment | null>
  updateById(id: string, data: Prisma.SegmentUpdateInput): Promise<Segment>
}
