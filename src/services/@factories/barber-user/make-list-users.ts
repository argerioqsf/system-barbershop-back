import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { PrismaAppointmentRepository } from '@/repositories/prisma/prisma-appointment-repository'
import { ListUsersService } from '@/services/barber-user/list-users'

export function makeListUsersService() {
  const users = new PrismaBarberUsersRepository()
  const appointments = new PrismaAppointmentRepository()
  return new ListUsersService(users, appointments)
}
