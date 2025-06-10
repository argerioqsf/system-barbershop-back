import { prisma } from '@/lib/prisma'
import { Appointment, Prisma } from '@prisma/client'
import { AppointmentRepository } from '../appointment-repository'

export class PrismaAppointmentRepository implements AppointmentRepository {
  async create(data: Prisma.AppointmentCreateInput): Promise<Appointment> {
    const appointment = await prisma.appointment.create({ data })
    return appointment
  }

  async findManyByUnit(unitId: string): Promise<Appointment[]> {
    return prisma.appointment.findMany({
      where: { unitId },
      include: { service: true, client: true, barber: true },
    })
  }

  async findById(id: string): Promise<Appointment | null> {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { service: true, client: true, barber: true },
    })
    return appointment
  }
}
