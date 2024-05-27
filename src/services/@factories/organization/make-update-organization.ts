import { PrismaOrganizationRepository } from '@/repositories/prisma/prisma-organization-repository'
import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { UpdateOrganizationService } from '@/services/organization/update-organization-service'

export default function makeUpdateOrganizationService() {
  return new UpdateOrganizationService(
    new PrismaOrganizationRepository(),
    new PrismaProfilesRepository(),
  )
}
