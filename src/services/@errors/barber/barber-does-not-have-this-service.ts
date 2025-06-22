export class BarberDoesNotHaveThisServiceError extends Error {
  constructor() {
    super('Barber does not have this service')
  }
}
