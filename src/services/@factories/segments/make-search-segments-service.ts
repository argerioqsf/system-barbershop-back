import { PrismaSegmentsRepository } from '@/repositories/prisma/prisma-segments-repository'
import { SearchSegmentsService } from '@/services/segments/search-segments-service'

export function makeSearchSegmentsService() {
  return new SearchSegmentsService(new PrismaSegmentsRepository())
}
