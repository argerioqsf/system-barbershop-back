import { PrismaAppointmentRepository } from '@/repositories/prisma/prisma-appointment-repository'
import { ListAppointmentsService } from '@/services/appointment/list-appointments'

export function makeListAppointments() {
  const repository = new PrismaAppointmentRepository()
  const service = new ListAppointmentsService(repository)
  return service
}
