import { AppointmentRepository } from '@/repositories/appointment-repository'
import { AppointmentTelemetry } from '@/modules/appointment/application/contracts/appointment-telemetry'
import { Appointment, Prisma } from '@prisma/client'

export interface UpdateAppointmentInput {
  id: string
  data: Prisma.AppointmentUpdateInput
  actorId: string
}

export interface UpdateAppointmentOutput {
  appointment: Appointment
}

export class UpdateAppointmentUseCase {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly telemetry: AppointmentTelemetry,
  ) {}

  async execute({
    id,
    data,
    actorId,
  }: UpdateAppointmentInput): Promise<UpdateAppointmentOutput> {
    const appointment = await this.appointmentRepository.update(id, data)

    await this.telemetry.record({
      operation: 'appointment.updated',
      appointmentId: appointment.id,
      actorId,
      metadata: {
        status: data.status,
      },
    })

    return { appointment }
  }
}
