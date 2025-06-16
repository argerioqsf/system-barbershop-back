import { PrismaOrganizationRepository } from '@/repositories/prisma/prisma-organization-repository'
import { DeleteOrganizationService } from '@/services/organization/delete-organization'

export function makeDeleteOrganizationService() {
  return new DeleteOrganizationService(new PrismaOrganizationRepository())
}
