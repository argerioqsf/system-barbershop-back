import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { ListAvailableBarbersUseCase } from '@/modules/appointment/application/use-cases/list-available-barbers'

export function makeListAvailableBarbers() {
  const barberUsersRepository = new PrismaBarberUsersRepository()

  return new ListAvailableBarbersUseCase(barberUsersRepository)
}
