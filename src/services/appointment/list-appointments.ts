import { UserToken } from '@/http/controllers/authenticate-controller'
import { assertUser } from '@/utils/assert-user'
import { assertPermission, getScope, buildUnitWhere } from '@/utils/permissions'
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
    assertUser(userToken)
    assertPermission(userToken.role, 'LIST_APPOINTMENTS')
    const scope = getScope(userToken)
    const where = buildUnitWhere(scope)
    const appointments = await this.repository.findMany(where)
    return { appointments }
  }
}
