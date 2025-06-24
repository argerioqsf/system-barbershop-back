import { AppointmentRepository } from '@/repositories/appointment-repository'
import { ServiceRepository } from '@/repositories/service-repository'
import { Appointment } from '@prisma/client'
import { ServiceNotFoundError } from '../@errors/service/service-not-found-error'
import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { BarberNotFoundError } from '../@errors/barber/barber-not-found-error'
import { BarberDoesNotHaveThisServiceError } from '../@errors/barber/barber-does-not-have-this-service'
import { UserNotFoundError } from '../@errors/user/user-not-found-error'
import { DayHourRepository } from '@/repositories/day-hour-repository'
import { isAppointmentAvailable } from '@/utils/barber-availability'
import { BarberNotAvailableError } from '../@errors/barber/barber-not-available-error'

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
    private barberUserRepository: BarberUsersRepository,
    private dayHourRepository: DayHourRepository,
  ) {}

  async execute(
    data: CreateAppointmentRequest,
  ): Promise<CreateAppointmentResponse> {
    let discount = 0
    const value = data.value

    const service = await this.serviceRepository.findById(data.serviceId)
    if (!service) throw new ServiceNotFoundError()

    const barber = await this.barberUserRepository.findById(data.barberId)
    if (!barber) throw new BarberNotFoundError()

    const client = await this.barberUserRepository.findById(data.clientId)
    if (!client) throw new UserNotFoundError()

    const seviceLinkBarber = barber.profile?.barberServices.find(
      (serviceB) => serviceB.serviceId === service.id,
    )

    if (!seviceLinkBarber) throw new BarberDoesNotHaveThisServiceError()

    const durationService =
      seviceLinkBarber?.time ?? service.defaultTime ?? null

    const duration = durationService ?? 0
    const available = await isAppointmentAvailable(
      barber as any,
      data.date,
      data.hour,
      duration,
      this.repository,
      this.dayHourRepository,
    )
    if (!available) throw new BarberNotAvailableError()

    if (typeof data.value === 'number') {
      const diff = service.price - data.value
      discount = diff < 0 ? service.price : diff
    }

    const appointment = await this.repository.create({
      client: { connect: { id: data.clientId } },
      barber: { connect: { id: data.barberId } },
      service: { connect: { id: data.serviceId } },
      unit: { connect: { id: data.unitId } },
      date: data.date,
      hour: data.hour,
      status: 'SCHEDULED',
      durationService,
      observation: data.observation,
      discount,
      value,
    })
    return { appointment }
  }
}
