import { AppointmentRepository } from '@/repositories/appointment-repository'
import { Appointment } from '@prisma/client'

interface CreateAppointmentRequest {
  clientId: string
  barberId: string
  serviceId: string
  unitId: string
  date: Date
  hour: string
}

interface CreateAppointmentResponse {
  appointment: Appointment
}

export class CreateAppointmentService {
  constructor(private repository: AppointmentRepository) {}

  async execute(data: CreateAppointmentRequest): Promise<CreateAppointmentResponse> {
    const appointment = await this.repository.create({
      client: { connect: { id: data.clientId } },
      barber: { connect: { id: data.barberId } },
      service: { connect: { id: data.serviceId } },
      unit: { connect: { id: data.unitId } },
      date: data.date,
      hour: data.hour,
    })
    return { appointment }
  }
}
