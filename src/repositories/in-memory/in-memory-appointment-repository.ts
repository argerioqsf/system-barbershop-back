import { Prisma, AppointmentStatus, Appointment } from '@prisma/client'
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

  async create(
    data: Prisma.AppointmentCreateInput,
    serviceIds: string[] = [],
  ): Promise<Appointment> {
    const typed = data as Partial<CreateInput>
    if (serviceIds.length === 0 && 'service' in data) {
      const srv = data.service as { connect: { id: string } }
      if (srv?.connect?.id) {
        serviceIds = [srv.connect.id]
      }
    }
    const appointment: Appointment = {
      id: randomUUID(),
      clientId: (data.client as { connect: { id: string } }).connect.id,
      barberId: (data.barber as { connect: { id: string } }).connect.id,
      unitId: (data.unit as { connect: { id: string } }).connect.id,
      date: data.date as Date,
      status: typed.status as AppointmentStatus,
      durationService: typed.durationService ?? null,
      observation: data.observation ?? null,
    }
    this.appointments.push({
      ...appointment,
      saleItem: null,
      services: serviceIds.map((sid) => ({
        id: sid,
        appointmentId: appointment.id,
        serviceId: sid,
        service: {
          id: sid,
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
      })),
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
        profile: {
          id: 'profile-' + appointment.barberId,
          phone: '',
          cpf: '',
          genre: '',
          birthday: '',
          pix: '',
          roleId: '',
          commissionPercentage: 0,
          totalBalance: 0,
          userId: appointment.barberId,
          createdAt: new Date(),
          barberServices: [],
          barberProducts: [],
          workHours: [],
          blockedHours: [],
        },
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
    if (data.observation !== undefined) {
      appointment.observation = data.observation as string | null
    }
    if (data.saleItem && 'connect' in data.saleItem) {
      const sid = (data.saleItem as { connect: { id: string } }).connect.id
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      appointment.saleItem = { id: sid } as any
    }
    return appointment
  }
}
