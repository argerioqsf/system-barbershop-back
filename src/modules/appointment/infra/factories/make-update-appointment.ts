import { PrismaAppointmentRepository } from '@/repositories/prisma/prisma-appointment-repository'
import { makeAppointmentTelemetry } from '@/modules/appointment/infra/factories/make-appointment-telemetry'
import { UpdateAppointmentUseCase } from '@/modules/appointment/application/use-cases/update-appointment'

export function makeUpdateAppointment() {
  const appointmentRepository = new PrismaAppointmentRepository()
  const telemetry = makeAppointmentTelemetry()

  return new UpdateAppointmentUseCase(appointmentRepository, telemetry)
}
