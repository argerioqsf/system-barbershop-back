export class BarberDoesNotHaveThisProductError extends Error {
  constructor() {
    super('Barber does not have this product')
  }
}
