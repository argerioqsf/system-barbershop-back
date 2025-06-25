export class BarberNotAvailableError extends Error {
  constructor() {
    super('Barber not available for the selected time')
  }
}
