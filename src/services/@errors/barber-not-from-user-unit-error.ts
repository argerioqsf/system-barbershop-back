export class BarberNotFromUserUnitError extends Error {
  constructor() {
    super('Barber does not belong to your unit')
  }
}
