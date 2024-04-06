import { Prisma, Segment } from "@prisma/client";
import { SegmentsRepository } from "../segments-repository";
import { prisma } from "@/lib/prisma";

export class PrismaSegmentsRepository implements SegmentsRepository {
  async findManyListIds(ids: string[]): Promise<{ id: string; name: string; }[]> {
    const segment = await prisma.segment.findMany({
      where: {
        id: {
          in: ids
        }
      }
    })

    return segment
  }
  async create(data: Prisma.SegmentCreateInput): Promise<Segment> {
    const segments = await prisma.segment.create({ data });

    return segments;
  }
  async findMany(): Promise<Segment[]> {
    const segments = await prisma.segment.findMany();

    return segments;
  }
}
