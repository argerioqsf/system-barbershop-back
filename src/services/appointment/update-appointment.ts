import {
  AppointmentRepository,
  Appointment,
  AppointmentUpdateInput,
} from '@/repositories/appointment-repository'

interface UpdateAppointmentRequest {
  id: string
  data: AppointmentUpdateInput
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
