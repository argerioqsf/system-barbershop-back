import { UnitRepository } from '@/repositories/unit-repository'
import { AppointmentDateAfterLimitError } from '@/services/@errors/appointment/appointment-date-after-limit-error'
import { AppointmentDateInPastError } from '@/services/@errors/appointment/appointment-date-in-past-error'
import { addDays } from 'date-fns'

export interface ValidateAppointmentWindowInput {
  unitId: string
  date: Date
}

export class ValidateAppointmentWindowService {
  constructor(private readonly unitRepository: UnitRepository) {}

  async execute({
    unitId,
    date,
  }: ValidateAppointmentWindowInput): Promise<void> {
    const now = new Date()

    if (date < now) {
      throw new AppointmentDateInPastError()
    }

    const unit = await this.unitRepository.findById(unitId)
    const limitDays = unit?.appointmentFutureLimitDays ?? 7

    if (limitDays <= 0) return

    const maxDate = addDays(now, limitDays)
    if (date > maxDate) {
      throw new AppointmentDateAfterLimitError()
    }
  }
}
