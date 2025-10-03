import { prisma } from '@/lib/prisma'
import { Prisma, Appointment, Service } from '@prisma/client'
import {
  AppointmentRepository,
  DetailedAppointment,
} from '../appointment-repository'

export class PrismaAppointmentRepository implements AppointmentRepository {
  async create(
    data: Prisma.AppointmentCreateInput,
    services: Service[],
  ): Promise<Appointment> {
    const appointment = await prisma.appointment.create({
      data: {
        ...data,
        services: {
          create: services.map((svc) => ({
            service: { connect: { id: svc.id } },
          })),
        },
      },
    })
    return appointment
  }

  async findManyByUnit(unitId: string): Promise<DetailedAppointment[]> {
    const appointments = await prisma.appointment.findMany({
      where: { unitId },
      include: {
        services: { include: { service: true, transactions: true } },
        client: true,
        barber: { include: { profile: true } },
      },
    })
    return appointments
  }

  async findMany(
    where: Prisma.AppointmentWhereInput = {},
  ): Promise<DetailedAppointment[]> {
    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        services: { include: { service: true, transactions: true } },
        client: true,
        barber: { include: { profile: true } },
        saleItem: true,
      },
    })
    return appointments
  }

  async findById(id: string): Promise<DetailedAppointment | null> {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        services: { include: { service: true, transactions: true } },
        client: true,
        barber: { include: { profile: true } },
        saleItem: true,
      },
    })
    return appointment
  }

  async update(
    id: string,
    data: Prisma.AppointmentUpdateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Appointment> {
    const prismaClient = tx || prisma
    return prismaClient.appointment.update({ where: { id }, data })
  }
}
