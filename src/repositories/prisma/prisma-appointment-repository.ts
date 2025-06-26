import { prisma } from '@/lib/prisma'
import { Appointment, Prisma } from '@prisma/client'
import {
  AppointmentRepository,
  DetailedAppointment,
} from '../appointment-repository'

export class PrismaAppointmentRepository implements AppointmentRepository {
  async create(
    data: Prisma.AppointmentCreateInput,
    serviceIds: string[],
  ): Promise<Appointment> {
    const appointment = await prisma.appointment.create({
      data: {
        ...data,
        services: {
          create: serviceIds.map((id) => ({ service: { connect: { id } } })),
        },
      },
    })
    return appointment
  }

  async findManyByUnit(unitId: string): Promise<DetailedAppointment[]> {
    return prisma.appointment.findMany({
      where: { unitId },
      include: {
        services: { include: { service: true } },
        client: true,
        barber: true,
      },
    })
  }

  async findMany(
    where: Prisma.AppointmentWhereInput = {},
  ): Promise<DetailedAppointment[]> {
    return prisma.appointment.findMany({
      where,
      include: {
        services: { include: { service: true } },
        client: true,
        barber: true,
      },
    })
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
    return appointment
  }

  async update(
    id: string,
    data: Prisma.AppointmentUpdateInput,
  ): Promise<Appointment> {
    return prisma.appointment.update({ where: { id }, data })
  }
}
