import { PrismaAppointmentRepository } from '@/repositories/prisma/prisma-appointment-repository'
import { PrismaServiceRepository } from '@/repositories/prisma/prisma-service-repository'
import { CreateAppointmentService } from '@/services/appointment/create-appointment'

export function makeCreateAppointment() {
  const repository = new PrismaAppointmentRepository()
  const serviceRepository = new PrismaServiceRepository()
  const service = new CreateAppointmentService(repository, serviceRepository)
  return service
}
