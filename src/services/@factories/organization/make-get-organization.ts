import { PrismaOrganizationRepository } from '@/repositories/prisma/prisma-organization-repository'
import { GetOrganizationService } from '@/services/organization/get-organization'

export function makeGetOrganizationService() {
  return new GetOrganizationService(new PrismaOrganizationRepository())
}
