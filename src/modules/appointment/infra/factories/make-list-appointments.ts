import { PrismaAppointmentRepository } from '@/repositories/prisma/prisma-appointment-repository'
import { ListAppointmentsUseCase } from '@/modules/appointment/application/use-cases/list-appointments'

export function makeListAppointments() {
  const appointmentRepository = new PrismaAppointmentRepository()

  return new ListAppointmentsUseCase(appointmentRepository)
}
