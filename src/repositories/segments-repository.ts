import { Prisma, Segment } from '@prisma/client'

export interface SegmentsRepository {
  create(data: Prisma.SegmentUncheckedCreateInput): Promise<Segment>
  findMany(): Promise<Segment[]>
}
