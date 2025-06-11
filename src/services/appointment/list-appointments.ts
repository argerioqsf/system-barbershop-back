import { AppointmentRepository, DetailedAppointment } from '@/repositories/appointment-repository'

interface ListAppointmentsResponse {
  appointments: DetailedAppointment[]
}

export class ListAppointmentsService {
  constructor(private repository: AppointmentRepository) {}

  async execute(unitId: string): Promise<ListAppointmentsResponse> {
    const appointments = await this.repository.findManyByUnit(unitId)
    return { appointments }
  }
}
