export class InvalidAppointmentStatusError extends Error {
  constructor() {
    super('Cannot link sale to appointment with this status')
  }
}
