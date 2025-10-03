import {
  AppointmentRepository,
  DetailedAppointment,
} from '@/repositories/appointment-repository'
import { UserToken } from '@/http/controllers/authenticate-controller'
import { assertUser } from '@/utils/assert-user'
import { buildUnitWhere, getScope } from '@/utils/permissions'

export interface ListAppointmentsOutput {
  appointments: DetailedAppointment[]
}

export class ListAppointmentsUseCase {
  constructor(private readonly appointmentRepository: AppointmentRepository) {}

  async execute(userToken: UserToken): Promise<ListAppointmentsOutput> {
    assertUser(userToken)
    const scope = getScope(userToken)
    const where = buildUnitWhere(scope)

    const appointments = await this.appointmentRepository.findMany(where)

    return { appointments }
  }
}
