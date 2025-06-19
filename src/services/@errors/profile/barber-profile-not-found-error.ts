export class BarberProfileNotFoundError extends Error {
  constructor() {
    super('Barber profile not found')
  }
}
