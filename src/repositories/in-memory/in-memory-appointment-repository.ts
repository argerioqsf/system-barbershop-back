import { Appointment, Prisma, Service, User } from '@prisma/client'
import {
  AppointmentRepository,
  DetailedAppointment,
} from '../appointment-repository'
import { randomUUID } from 'crypto'

export class InMemoryAppointmentRepository implements AppointmentRepository {
  public appointments: DetailedAppointment[] = []

  async create(data: Prisma.AppointmentCreateInput): Promise<Appointment> {
    const appointment: Appointment = {
      id: randomUUID(),
      clientId: (data.client as any).connect.id,
      barberId: (data.barber as any).connect.id,
      serviceId: (data.service as any).connect.id,
      unitId: (data.unit as any).connect.id,
      date: data.date as Date,
      hour: data.hour as string,
    }
    this.appointments.push({
      ...appointment,
      service: {
        id: appointment.serviceId,
        name: '',
        description: null,
        imageUrl: null,
        cost: 0,
        price: 0,
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
        createdAt: new Date(),
      },
    })
    return appointment
  }

  async findManyByUnit(unitId: string): Promise<DetailedAppointment[]> {
    return this.appointments.filter((a) => a.unitId === unitId)
  }

  async findMany(
    where: Prisma.AppointmentWhereInput = {},
  ): Promise<DetailedAppointment[]> {
    return this.appointments.filter((a: any) => {
      if (where.unitId && a.unitId !== where.unitId) return false
      if (where.unit && 'organizationId' in (where.unit as any)) {
        return a.unit?.organizationId === (where.unit as any).organizationId
      }
      return true
    })
  }

  async findById(id: string): Promise<DetailedAppointment | null> {
    return this.appointments.find((a) => a.id === id) ?? null
  }
}
