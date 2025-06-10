import { PrismaAppointmentRepository } from '@/repositories/prisma/prisma-appointment-repository'
import { CreateAppointmentService } from '@/services/appointment/create-appointment'

export function makeCreateAppointment() {
  const repository = new PrismaAppointmentRepository()
  const service = new CreateAppointmentService(repository)
  return service
}
