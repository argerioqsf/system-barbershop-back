import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { ListClientsService } from '@/services/users/list-clients'

export function makeListClientsService() {
  const repository = new PrismaBarberUsersRepository()
  return new ListClientsService(repository)
}
