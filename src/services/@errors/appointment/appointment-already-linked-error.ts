export class AppointmentAlreadyLinkedError extends Error {
  constructor() {
    super('Appointment already linked to a sale')
  }
}
