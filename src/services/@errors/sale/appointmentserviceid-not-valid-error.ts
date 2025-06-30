export class AppointmentServiceIdNotValidError extends Error {
  constructor() {
    super('AppointmentServiceIds is not valid')
  }
}
