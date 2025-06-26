export class AppointmentDateInPastError extends Error {
  constructor() {
    super('Cannot schedule appointment in the past')
  }
}
