import { AppointmentRepository } from '@/repositories/appointment-repository'

export class ListPendingCommissionAppointmentsUseCase {
  constructor(private appointmentRepository: AppointmentRepository) {}

  async execute(userId: string) {
    const appointments =
      await this.appointmentRepository.findManyPendingCommission(userId)

    return appointments
  }
}
