import { Prisma, Segment } from '@prisma/client'

export interface SegmentsRepository {
  create(data: Prisma.SegmentUncheckedCreateInput): Promise<Segment>
  findMany(page: number, query?: string): Promise<Segment[]>
  mountSelect(): Promise<Segment[]>
  findManyListIds(ids: string[]): Promise<Segment[]>
}
