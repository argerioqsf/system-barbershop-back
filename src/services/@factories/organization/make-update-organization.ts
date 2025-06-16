import { PrismaOrganizationRepository } from '@/repositories/prisma/prisma-organization-repository'
import { UpdateOrganizationService } from '@/services/organization/update-organization'

export function makeUpdateOrganizationService() {
  return new UpdateOrganizationService(new PrismaOrganizationRepository())
}
