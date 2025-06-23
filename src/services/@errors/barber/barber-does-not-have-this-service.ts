export class BarberDoesNotHaveThisServiceError extends Error {
  constructor() {
    super('The barber does not have this item linked')
  }
}
