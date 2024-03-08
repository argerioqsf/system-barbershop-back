import { Prisma, segment } from "@prisma/client";

export interface SegmentsRepository {
  create(data: Prisma.segmentUncheckedCreateInput): Promise<segment>;
}
