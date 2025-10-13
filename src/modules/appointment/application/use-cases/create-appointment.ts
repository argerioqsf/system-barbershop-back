import { AppointmentRepository } from '@/repositories/appointment-repository'
import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { ServiceRepository } from '@/repositories/service-repository'
import {
  Appointment,
  BarberService,
  Service,
  PermissionName,
} from '@prisma/client'
import { AppointmentTelemetry } from '../contracts/appointment-telemetry'
import { ValidateAppointmentWindowService } from '../services/validate-appointment-window-service'
import { CheckBarberAvailabilityService } from '../services/check-barber-availability-service'
import { SyncAppointmentSaleService } from '../services/sync-appointment-sale-service'
import { BarberNotFoundError } from '@/services/@errors/barber/barber-not-found-error'
import { ProfileNotFoundError } from '@/services/@errors/profile/profile-not-found-error'
import { BarberNotFromUserUnitError } from '@/services/@errors/barber/barber-not-from-user-unit-error'
import { ServiceNotFoundError } from '@/services/@errors/service/service-not-found-error'
import { UserNotFoundError } from '@/services/@errors/user/user-not-found-error'
import { BarberDoesNotHaveThisServiceError } from '@/services/@errors/barber/barber-does-not-have-this-service'
import { assertPermission } from '@/utils/permissions'

interface CreateAppointmentInput {
  clientId: string
  barberId: string
  serviceIds: string[]
  unitId: string
  userId: string
  date: Date
  observation?: string
}

interface CreateAppointmentOutput {
  appointment: Appointment
}

export class CreateAppointmentUseCase {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly serviceRepository: ServiceRepository,
    private readonly barberUsersRepository: BarberUsersRepository,
    private readonly validateAppointmentWindow: ValidateAppointmentWindowService,
    private readonly checkBarberAvailability: CheckBarberAvailabilityService,
    private readonly syncAppointmentSaleService: SyncAppointmentSaleService,
    private readonly telemetry: AppointmentTelemetry,
  ) {}

  async execute(
    input: CreateAppointmentInput,
  ): Promise<CreateAppointmentOutput> {
    const barber = await this.barberUsersRepository.findById(input.barberId)
    if (!barber) {
      throw new BarberNotFoundError()
    }
    if (!barber.profile) {
      throw new ProfileNotFoundError()
    }
    if (barber.unitId !== input.unitId) {
      throw new BarberNotFromUserUnitError()
    }

    const services = await this.loadServices(input.serviceIds)
    // const totalPrice = services.reduce(
    //   (total, service) => total + service.price,
    //   0,
    // )

    const client = await this.barberUsersRepository.findById(input.clientId)
    if (!client) {
      throw new UserNotFoundError()
    }

    const durationInMinutes = this.calculateDurationInMinutes(
      services,
      barber.profile.barberServices,
    )

    await this.validateAppointmentWindow.execute({
      unitId: input.unitId,
      date: input.date,
    })

    await this.checkBarberAvailability.execute({
      barber,
      date: input.date,
      durationInMinutes,
    })

    assertPermission(
      [PermissionName.ACCEPT_APPOINTMENT],
      barber.profile.permissions.map((permission) => permission.name),
    )

    const appointment = await this.appointmentRepository.create(
      {
        client: { connect: { id: input.clientId } },
        barber: { connect: { id: input.barberId } },
        unit: { connect: { id: input.unitId } },
        date: input.date,
        status: 'SCHEDULED',
        durationService: durationInMinutes,
        observation: input.observation,
      },
      services,
    )
    // TODO: nao vou vincular o agendamento no momento da cricacao ainda
    // pois acho que fica muito ditatorio esse comportamento, vou deixar
    // o usuario criar uma sale e vinculala, mas pretendo criar uma logica que
    // ira criar uma sale se for da vontade do usuario gestor mas apenas quando
    // o status do agendamento mudar para confirmado, ou outra regra

    // await this.syncAppointmentSaleService.createSale({
    //   appointmentId: appointment.id,
    //   barberId: input.barberId,
    //   clientId: input.clientId,
    //   unitId: input.unitId,
    //   createdByUserId: input.userId,
    //   price: totalPrice,
    // })

    await this.telemetry.record({
      operation: 'appointment.created',
      appointmentId: appointment.id,
      actorId: input.userId,
      metadata: {
        unitId: input.unitId,
        barberId: input.barberId,
        clientId: input.clientId,
        serviceIds: input.serviceIds,
      },
    })

    return { appointment }
  }

  private async loadServices(serviceIds: string[]): Promise<Service[]> {
    const services: Service[] = []

    for (const serviceId of serviceIds) {
      const service = await this.serviceRepository.findById(serviceId)
      if (!service) {
        throw new ServiceNotFoundError()
      }
      services.push(service)
    }

    return services
  }

  private calculateDurationInMinutes(
    services: Service[],
    barberServices: BarberService[],
  ): number {
    let totalDuration = 0

    for (const service of services) {
      const link = barberServices.find(
        (barberService) => barberService.serviceId === service.id,
      )

      if (!link) {
        throw new BarberDoesNotHaveThisServiceError()
      }
      // TODO: o campo defaultTime no service precisa ser obrigatório
      totalDuration += link.time ?? service.defaultTime ?? 0
    }

    return totalDuration
  }
}
