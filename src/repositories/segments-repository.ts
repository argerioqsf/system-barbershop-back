import { Prisma, Segment } from '@prisma/client'

export interface SegmentsRepository {
  create(data: Prisma.SegmentUncheckedCreateInput): Promise<Segment>
  findMany(page: number): Promise<Segment[]>
  findManyListIds(ids: string[]): Promise<Segment[]>
  searchMany(query: string, page: number): Promise<Segment[]>
}
