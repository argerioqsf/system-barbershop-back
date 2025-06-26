import { PrismaAppointmentRepository } from '@/repositories/prisma/prisma-appointment-repository'
import { UpdateAppointmentService } from '@/services/appointment/update-appointment'

export function makeUpdateAppointment() {
  const repository = new PrismaAppointmentRepository()
  return new UpdateAppointmentService(repository)
}
