import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { PrismaAppointmentRepository } from '@/repositories/prisma/prisma-appointment-repository'
import { PrismaDayHourRepository } from '@/repositories/prisma/prisma-day-hour-repository'
import { ListUsersService } from '@/services/barber-user/list-users'

export function makeListUsersService() {
  const users = new PrismaBarberUsersRepository()
  const appointments = new PrismaAppointmentRepository()
  const dayHours = new PrismaDayHourRepository()
  return new ListUsersService(users, appointments, dayHours)
}
