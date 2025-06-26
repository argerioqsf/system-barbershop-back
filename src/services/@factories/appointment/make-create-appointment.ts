import { PrismaAppointmentRepository } from '@/repositories/prisma/prisma-appointment-repository'
import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { PrismaServiceRepository } from '@/repositories/prisma/prisma-service-repository'
import { PrismaSaleRepository } from '@/repositories/prisma/prisma-sale-repository'
import { CreateAppointmentService } from '@/services/appointment/create-appointment'

export function makeCreateAppointment() {
  const repository = new PrismaAppointmentRepository()
  const serviceRepository = new PrismaServiceRepository()
  const barberUserRepository = new PrismaBarberUsersRepository()
  const saleRepository = new PrismaSaleRepository()
  const service = new CreateAppointmentService(
    repository,
    serviceRepository,
    barberUserRepository,
    saleRepository,
  )
  return service
}
