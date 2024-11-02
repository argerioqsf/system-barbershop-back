import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { PrismaUsersRepository } from '@/repositories/prisma/prisma-users-repository'
import { SentContractService } from '@/services/indicator/sent-contract-service'

export function makeSentContractService() {
  return new SentContractService(
    new PrismaUsersRepository(),
    new PrismaProfilesRepository(),
  )
}
