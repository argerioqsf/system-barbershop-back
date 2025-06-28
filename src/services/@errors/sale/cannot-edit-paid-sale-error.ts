export class CannotEditPaidSaleError extends Error {
  constructor() {
    super('Cannot edit a paid sale')
  }
}
