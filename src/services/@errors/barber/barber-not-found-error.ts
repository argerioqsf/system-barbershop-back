export class BarberNotFoundError extends Error {
  constructor() {
    super('Barber not found')
  }
}
