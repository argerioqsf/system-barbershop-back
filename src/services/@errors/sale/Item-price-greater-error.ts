export class ItemPriceGreaterError extends Error {
  constructor() {
    super('Item price greater than service price')
  }
}
