export class BarberCannotSellItemError extends Error {
  constructor(barberName?: string, productName?: string) {
    super(`Barber ${barberName} cannot sell ${productName ?? 'item'}`)
  }
}
