export class ItemNeedsServiceOrProductError extends Error {
  constructor() {
    super('Item must have serviceId or productId')
  }
}
