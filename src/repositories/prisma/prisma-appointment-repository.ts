import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import {
  AppointmentRepository,
  DetailedAppointment,
  Appointment,
  AppointmentCreateInput,
  AppointmentUpdateInput,
} from '../appointment-repository'

export class PrismaAppointmentRepository implements AppointmentRepository {
  async create(
    data: AppointmentCreateInput,
    serviceIds: string[],
  ): Promise<Appointment> {
    const { discount, value, ...dbData } = data as any
    const appointment = await prisma.appointment.create({
      data: {
        ...dbData,
        services: {
          create: serviceIds.map((id) => ({ service: { connect: { id } } })),
        },
      },
    })
    return { ...appointment, discount: discount ?? 0, value: value ?? null }
  }

  async findManyByUnit(unitId: string): Promise<DetailedAppointment[]> {
    const appointments = await prisma.appointment.findMany({
      where: { unitId },
      include: {
        services: { include: { service: true } },
        client: true,
        barber: true,
      },
    })
    return appointments.map((a) => ({
      ...a,
      services: a.services.map((s) => s.service),
    })) as DetailedAppointment[]
  }

  async findMany(
    where: Prisma.AppointmentWhereInput = {},
  ): Promise<DetailedAppointment[]> {
    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        services: { include: { service: true } },
        client: true,
        barber: true,
      },
    })
    return appointments.map((a) => ({
      ...a,
      services: a.services.map((s) => s.service),
    })) as DetailedAppointment[]
  }

  async findById(id: string): Promise<DetailedAppointment | null> {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        services: { include: { service: true } },
        client: true,
        barber: true,
      },
    })
    if (!appointment) return null
    return {
      ...appointment,
      services: appointment.services.map((s) => s.service),
    } as DetailedAppointment
  }

  async update(id: string, data: AppointmentUpdateInput): Promise<Appointment> {
    const { discount, value, ...dbData } = data as any
    const appointment = await prisma.appointment.update({
      where: { id },
      data: dbData,
    })
    return { ...appointment, discount: discount ?? null, value: value ?? null }
  }
}
