import { prisma } from '@/lib/prisma'
import { Appointment, Prisma } from '@prisma/client'
import { AppointmentRepository } from '../appointment-repository'

export class PrismaAppointmentRepository implements AppointmentRepository {
  async create(data: Prisma.AppointmentCreateInput): Promise<Appointment> {
    const appointment = await prisma.appointment.create({ data })
    return appointment
  }

  async findMany(): Promise<Appointment[]> {
    const appointments = await prisma.appointment.findMany({
      include: { service: true, client: true, barber: true },
    })
    return appointments
  }

  async findById(id: string): Promise<Appointment | null> {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { service: true, client: true, barber: true },
    })
    return appointment
  }
}
