import { PrismaOrganizationRepository } from '@/repositories/prisma/prisma-organization-repository'
import { ListOrganizationsService } from '@/services/organization/list-organizations'

export function makeListOrganizationsService() {
  return new ListOrganizationsService(new PrismaOrganizationRepository())
}
