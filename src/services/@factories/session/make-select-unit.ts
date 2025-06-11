import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'
import { PrismaUsersRepository } from '@/repositories/prisma/prisma-users-repository'
import { SelectUnitService } from '@/services/session/select-unit'

export function makeSelectUnitService() {
  const usersRepository = new PrismaUsersRepository()
  const unitsRepository = new PrismaUnitRepository()
  return new SelectUnitService(usersRepository, unitsRepository)
}
