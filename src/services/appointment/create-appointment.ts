import { AppointmentRepository } from '@/repositories/appointment-repository'
import { Appointment } from '@prisma/client'
import { ServiceRepository } from '@/repositories/service-repository'
import { PaymentMethod, PaymentStatus, Service } from '@prisma/client'
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
import { AppointmentDateInPastError } from '../@errors/appointment/appointment-date-in-past-error'
import { BarberNotFromUserUnitError } from '../@errors/barber/barber-not-from-user-unit-error'

interface CreateAppointmentRequest {
  clientId: string
  barberId: string
  serviceIds: string[]
  unitId: string
  userId: string
  date: Date
  observation?: string
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
    const services = [] as Service[]
    for (const id of data.serviceIds) {
      const svc = await this.serviceRepository.findById(id)
      if (!svc) throw new ServiceNotFoundError()
      services.push(svc)
    }

    const totalPrice = services.reduce((acc, s) => acc + s.price, 0)
    const value = totalPrice

    const barber = await this.barberUserRepository.findById(data.barberId)
    if (!barber) throw new BarberNotFoundError()
    if (barber.unitId !== data.unitId) throw new BarberNotFromUserUnitError()

    const client = await this.barberUserRepository.findById(data.clientId)
    if (!client) throw new UserNotFoundError()

    let totalDuration = 0
    for (const svc of services) {
      const link = barber.profile?.barberServices.find(
        (bs) => bs.serviceId === svc.id,
      )
      if (!link) throw new BarberDoesNotHaveThisServiceError()
      totalDuration += link?.time ?? svc.defaultTime ?? 0
    }

    if (data.date < new Date()) {
      throw new AppointmentDateInPastError()
    }

    const duration = totalDuration
    const available = await isAppointmentAvailable(
      barber as BarberWithHours,
      data.date,
      duration,
      this.repository,
    )
    if (!available) throw new BarberNotAvailableError()

    const appointment = await this.repository.create(
      {
        client: { connect: { id: data.clientId } },
        barber: { connect: { id: data.barberId } },
        unit: { connect: { id: data.unitId } },
        date: data.date,
        status: 'SCHEDULED',
        durationService: totalDuration,
        observation: data.observation,
      },
      data.serviceIds,
    )

    const price = value

    await this.saleRepository.create({
      total: value,
      method: PaymentMethod.CASH,
      paymentStatus: PaymentStatus.PENDING,
      user: { connect: { id: data.userId } },
      client: { connect: { id: data.clientId } },
      unit: { connect: { id: data.unitId } },
      items: {
        create: [
          {
            appointment: { connect: { id: appointment.id } },
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
