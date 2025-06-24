export class ItemNeedsServiceOrProductOrAppointmentError extends Error {
  constructor() {
    super('Item must have service or product or appointment')
  }
}
