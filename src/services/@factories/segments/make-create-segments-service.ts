import { PrismaCoursesRepository } from "@/repositories/prisma/prisma-courses-repository";
import { PrismaCourseSegmentRepository } from "@/repositories/prisma/prisma-courses-segment-repository";
import { PrismaSegmentsRepository } from "@/repositories/prisma/prisma-segments-repository";
import { CreateSegmentService } from "@/services/segments/create-segment-service";

export function makeCreateSegmentsService() {
  return new CreateSegmentService(new PrismaSegmentsRepository(), new PrismaCoursesRepository(), new PrismaCourseSegmentRepository());
}
