import { AppointmentRepository } from '@/repositories/appointment-repository'
import { BarberNotAvailableError } from '@/services/@errors/barber/barber-not-available-error'
import {
  BarberWithHours,
  isAppointmentAvailable,
} from '@/utils/barber-availability'

export interface CheckBarberAvailabilityInput {
  barber: BarberWithHours
  date: Date
  durationInMinutes: number
}

export class CheckBarberAvailabilityService {
  constructor(private readonly appointmentRepository: AppointmentRepository) {}

  async execute({
    barber,
    date,
    durationInMinutes,
  }: CheckBarberAvailabilityInput): Promise<void> {
    const available = await isAppointmentAvailable(
      barber,
      date,
      durationInMinutes,
      this.appointmentRepository,
    )

    if (!available) {
      throw new BarberNotAvailableError()
    }
  }
}
