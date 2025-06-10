import { AppointmentRepository } from '@/repositories/appointment-repository'
import { Appointment } from '@prisma/client'

interface ListAppointmentsResponse {
  appointments: Appointment[]
}

export class ListAppointmentsService {
  constructor(private repository: AppointmentRepository) {}

  async execute(): Promise<ListAppointmentsResponse> {
    const appointments = await this.repository.findMany()
    return { appointments }
  }
}
