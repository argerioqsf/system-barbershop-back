import { AppointmentRepository } from '@/repositories/appointment-repository'
import { Prisma, Appointment } from '@prisma/client'

interface UpdateAppointmentRequest {
  id: string
  data: Prisma.AppointmentUpdateInput
}

interface UpdateAppointmentResponse {
  appointment: Appointment
}

export class UpdateAppointmentService {
  constructor(private repository: AppointmentRepository) {}

  async execute({
    id,
    data,
  }: UpdateAppointmentRequest): Promise<UpdateAppointmentResponse> {
    const appointment = await this.repository.update(id, data)
    return { appointment }
  }
}
