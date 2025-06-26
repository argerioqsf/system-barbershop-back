import { AppointmentRepository } from '@/repositories/appointment-repository'
import { ServiceRepository } from '@/repositories/service-repository'
import { Appointment, PaymentMethod, PaymentStatus } from '@prisma/client'
import { SaleRepository } from '@/repositories/sale-repository'
import { ServiceNotFoundError } from '../@errors/service/service-not-found-error'
import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { BarberNotFoundError } from '../@errors/barber/barber-not-found-error'
import { BarberDoesNotHaveThisServiceError } from '../@errors/barber/barber-does-not-have-this-service'
import { UserNotFoundError } from '../@errors/user/user-not-found-error'
import {
  isAppointmentAvailable,
  BarberWithHours,
} from '@/utils/barber-availability'
import { BarberNotAvailableError } from '../@errors/barber/barber-not-available-error'
import { BarberNotFromUserUnitError } from '../@errors/barber/barber-not-from-user-unit-error'

interface CreateAppointmentRequest {
  clientId: string
  barberId: string
  serviceId: string
  unitId: string
  userId: string
  date: Date
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
    private saleRepository: SaleRepository,
  ) {}

  async execute(
    data: CreateAppointmentRequest,
  ): Promise<CreateAppointmentResponse> {
    let discount = 0
    let value = data.value

    const service = await this.serviceRepository.findById(data.serviceId)
    if (!service) throw new ServiceNotFoundError()

    value = value ?? service.price

    const barber = await this.barberUserRepository.findById(data.barberId)
    if (!barber) throw new BarberNotFoundError()
    if (barber.unitId !== data.unitId) throw new BarberNotFromUserUnitError()

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
      barber as BarberWithHours,
      data.date,
      duration,
      this.repository,
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
      status: 'SCHEDULED',
      durationService,
      observation: data.observation,
      discount,
      value,
    })

    const price = value ?? Math.max(service.price - discount, 0)

    await this.saleRepository.create({
      total: price,
      method: PaymentMethod.CASH,
      paymentStatus: PaymentStatus.PENDING,
      user: { connect: { id: data.userId } },
      client: { connect: { id: data.clientId } },
      unit: { connect: { id: data.unitId } },
      items: {
        create: [
          {
            appointment: { connect: { id: appointment.id } },
            service: { connect: { id: data.serviceId } },
            barber: { connect: { id: data.barberId } },
            quantity: 1,
            price,
          },
        ],
      },
    })
    return { appointment }
  }
}
