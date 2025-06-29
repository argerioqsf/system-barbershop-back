import { Prisma, AppointmentService } from '@prisma/client'
import { AppointmentServiceRepository } from '../appointment-service-repository'
import { InMemoryAppointmentRepository } from './in-memory-appointment-repository'

export class InMemoryAppointmentServiceRepository
  implements AppointmentServiceRepository
{
  constructor(private appointmentRepository: InMemoryAppointmentRepository) {}

  async update(
    id: string,
    data: Prisma.AppointmentServiceUpdateInput,
  ): Promise<AppointmentService> {
    for (const appointment of this.appointmentRepository.appointments) {
      const service = appointment.services?.find((s) => s.id === id)
      if (service) {
        if (data.commissionPercentage !== undefined) {
          service.commissionPercentage = data.commissionPercentage as
            | number
            | null
        }
        const updateData = data as unknown as { commissionPaid?: boolean }
        if (updateData.commissionPaid !== undefined) {
          ;(service as unknown as { commissionPaid: boolean }).commissionPaid =
            updateData.commissionPaid
        }
        return service as AppointmentService
      }
    }
    throw new Error('Appointment service not found')
  }
}
