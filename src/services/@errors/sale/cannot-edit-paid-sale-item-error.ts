export class CannotEditPaidSaleItemError extends Error {
  constructor() {
    super('Cannot edit a paid sale item')
  }
}
