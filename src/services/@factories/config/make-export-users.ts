import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { ExportUsersService } from '@/services/config/export-users'

export function makeExportUsers() {
  const repository = new PrismaBarberUsersRepository()
  const service = new ExportUsersService(repository)
  return service
}
