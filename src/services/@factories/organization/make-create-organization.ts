import { PrismaOrganizationRepository } from '@/repositories/prisma/prisma-organization-repository'
import { CreateOrganizationService } from '@/services/organization/create-organization'

export function makeCreateOrganizationService() {
  return new CreateOrganizationService(new PrismaOrganizationRepository())
}
