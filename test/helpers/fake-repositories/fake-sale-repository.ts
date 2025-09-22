import { InMemorySaleRepository } from '../../src/repositories/in-memory/in-memory-sale-repository'
import { DetailedSale } from '../../src/repositories/sale-repository'

export class FakeSaleRepository extends InMemorySaleRepository {
  constructor() {
    super()
  }

  seedSale(sale: DetailedSale) {
    this.sales.push(sale)
  }
}
