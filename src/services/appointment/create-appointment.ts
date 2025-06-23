import { AppointmentRepository } from '@/repositories/appointment-repository'
import { ServiceRepository } from '@/repositories/service-repository'
import { Appointment } from '@prisma/client'

interface CreateAppointmentRequest {
  clientId: string
  barberId: string
  serviceId: string
  unitId: string
  date: Date
  hour: string
  observation?: string
  discount?: number
  value?: number
}

interface CreateAppointmentResponse {
  appointment: Appointment
}

export class CreateAppointmentService {
  constructor(
    private repository: AppointmentRepository,
    private serviceRepository: ServiceRepository,
  ) {}

  async execute(
    data: CreateAppointmentRequest,
  ): Promise<CreateAppointmentResponse> {
    let discount = data.discount ?? 0
    const value = data.value
    if (typeof data.value === 'number') {
      const service = await this.serviceRepository.findById(data.serviceId)
      if (service) {
        const diff = service.price - data.value
        discount = diff < 0 ? service.price : diff
      }
    }

    const appointment = await this.repository.create({
      client: { connect: { id: data.clientId } },
      barber: { connect: { id: data.barberId } },
      service: { connect: { id: data.serviceId } },
      unit: { connect: { id: data.unitId } },
      date: data.date,
      hour: data.hour,
      observation: data.observation,
      discount,
      value,
    })
    return { appointment }
  }
}
