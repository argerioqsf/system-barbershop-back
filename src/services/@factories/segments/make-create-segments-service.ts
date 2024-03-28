import { PrismaSegmentsRepository } from "@/repositories/prisma/prisma-segments-repository";
import { CreateSegmentService } from "@/services/segments/create-segment-service";

export function makeCreateSegmentsService() {
  return new CreateSegmentService(new PrismaSegmentsRepository());
}
