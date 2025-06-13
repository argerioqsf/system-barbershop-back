import { UserToken } from '@/http/controllers/authenticate-controller'
import {
  AppointmentRepository,
  DetailedAppointment,
} from '@/repositories/appointment-repository'

interface ListAppointmentsResponse {
  appointments: DetailedAppointment[]
}

export class ListAppointmentsService {
  constructor(private repository: AppointmentRepository) {}

  async execute(userToken: UserToken): Promise<ListAppointmentsResponse> {
    if (!userToken.sub) throw new Error('User not found')
    let appointments = []

    if (userToken.role === 'OWNER') {
      appointments = await this.repository.findMany({
        unit: { organizationId: userToken.organizationId },
      })
    } else if (userToken.role === 'ADMIN') {
      appointments = await this.repository.findMany()
    } else {
      appointments = await this.repository.findManyByUnit(userToken.unitId)
    }
    return { appointments }
  }
}
