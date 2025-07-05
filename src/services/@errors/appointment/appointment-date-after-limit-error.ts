export class AppointmentDateAfterLimitError extends Error {
  constructor() {
    super('Cannot schedule appointment so far in the future')
  }
}
