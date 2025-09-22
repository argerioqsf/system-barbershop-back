import { FakeSaleRepository } from '../fake-repositories'
import { makeSaleWithBarber } from '../default-values'

export function seedBasicSale(repo: FakeSaleRepository, overrides: Partial<ReturnType<typeof makeSaleWithBarber>> = {}) {
  const sale = makeSaleWithBarber()
  Object.assign(sale, overrides)
  repo.sales.push(sale)
  return sale
}
