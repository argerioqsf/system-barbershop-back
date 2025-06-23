import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { ListAppointmentBarbersService } from '@/services/users/list-appointment-barbers'

export function makeListAppointmentBarbersService() {
  const repository = new PrismaBarberUsersRepository()
  return new ListAppointmentBarbersService(repository)
}
