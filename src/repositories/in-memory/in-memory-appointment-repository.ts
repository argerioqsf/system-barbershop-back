import { Appointment, Prisma, AppointmentStatus } from '@prisma/client'
import {
  AppointmentRepository,
  DetailedAppointment,
} from '../appointment-repository'
import { randomUUID } from 'crypto'

type CreateInput = Prisma.AppointmentCreateInput & {
  status: AppointmentStatus
  durationService?: number | null
}

export class InMemoryAppointmentRepository implements AppointmentRepository {
  public appointments: DetailedAppointment[] = []

  async create(data: CreateInput): Promise<Appointment> {
    const appointment: Appointment = {
      id: randomUUID(),
      clientId: (data.client as { connect: { id: string } }).connect.id,
      barberId: (data.barber as { connect: { id: string } }).connect.id,
      serviceId: (data.service as { connect: { id: string } }).connect.id,
      unitId: (data.unit as { connect: { id: string } }).connect.id,
      date: data.date as Date,
      status: data.status,
      durationService: data.durationService ?? null,
      observation: data.observation ?? null,
      discount: data.discount ?? 0,
      value: data.value ?? null,
    }
    this.appointments.push({
      ...appointment,
      discount: appointment.discount,
      value: appointment.value,
      service: {
        id: appointment.serviceId,
        name: '',
        description: null,
        imageUrl: null,
        cost: 0,
        price: 0,
        category: null,
        defaultTime: null,
        commissionPercentage: null,
        unitId: appointment.unitId,
      },
      client: {
        id: appointment.clientId,
        name: '',
        email: '',
        password: '',
        active: true,
        organizationId: 'org-1',
        unitId: appointment.unitId,
        versionToken: 1,
        versionTokenInvalidate: null,
        createdAt: new Date(),
      },
      barber: {
        id: appointment.barberId,
        name: '',
        email: '',
        password: '',
        active: true,
        organizationId: 'org-1',
        unitId: appointment.unitId,
        versionToken: 1,
        versionTokenInvalidate: null,
        createdAt: new Date(),
      },
      unit: {
        id: appointment.unitId,
        name: '',
        slug: '',
        organizationId: 'org-1',
        totalBalance: 0,
        allowsLoan: false,
        slotDuration: 60,
      },
    } as DetailedAppointment & { unit: { organizationId: string } })
    return appointment
  }

  async findManyByUnit(unitId: string): Promise<DetailedAppointment[]> {
    return this.appointments.filter((a) => a.unitId === unitId)
  }

  async findMany(
    where: Prisma.AppointmentWhereInput = {},
  ): Promise<DetailedAppointment[]> {
    return this.appointments.filter((a) => {
      if (where.unitId && a.unitId !== where.unitId) return false
      if (where.barberId && a.barberId !== where.barberId) return false
      if (where.date && a.date.getTime() !== (where.date as Date).getTime())
        return false
      if (
        where.unit &&
        'organizationId' in (where.unit as { organizationId: string })
      ) {
        return (
          (a as unknown as { unit?: { organizationId: string } }).unit
            ?.organizationId ===
          (where.unit as { organizationId: string }).organizationId
        )
      }
      return true
    })
  }

  async findById(id: string): Promise<DetailedAppointment | null> {
    return this.appointments.find((a) => a.id === id) ?? null
  }

  async update(
    id: string,
    data: Prisma.AppointmentUpdateInput,
  ): Promise<Appointment> {
    const appointment = this.appointments.find((a) => a.id === id)
    if (!appointment) throw new Error('Appointment not found')
    if (data.status) {
      appointment.status = data.status as AppointmentStatus
    }
    return appointment
  }
}
