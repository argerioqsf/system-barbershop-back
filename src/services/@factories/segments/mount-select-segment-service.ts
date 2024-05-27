import { PrismaSegmentsRepository } from '@/repositories/prisma/prisma-segments-repository'
import { MountSelectSegmentsService } from '@/services/segments/mount-select-service'

export function makeMountSelectSegmentsService() {
  return new MountSelectSegmentsService(new PrismaSegmentsRepository())
}
