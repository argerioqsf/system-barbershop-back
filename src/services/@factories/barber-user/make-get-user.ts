import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { PrismaAppointmentRepository } from '@/repositories/prisma/prisma-appointment-repository'
import { PrismaDayHourRepository } from '@/repositories/prisma/prisma-day-hour-repository'
import { GetUserService } from '@/services/barber-user/get-user'

export function makeGetUserService() {
  const users = new PrismaBarberUsersRepository()
  const appointments = new PrismaAppointmentRepository()
  const dayHours = new PrismaDayHourRepository()
  return new GetUserService(users, appointments, dayHours)
}
