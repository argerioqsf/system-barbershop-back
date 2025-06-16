import { describe, it, expect, beforeEach } from 'vitest'
import { GetSaleService } from '../../../src/services/sale/get-sale'
import { FakeSaleRepository } from '../../helpers/fake-repositories'
import { makeSale } from '../../helpers/default-values'

describe('Get sale service', () => {
  let repo: FakeSaleRepository
  let service: GetSaleService

  const sale = makeSale('sale-1')

  beforeEach(() => {
    repo = new FakeSaleRepository()
    repo.sales.push(sale)
    service = new GetSaleService(repo)
  })

  it('returns sale when found', async () => {
    const res = await service.execute({ id: 'sale-1' })
    expect(res.sale?.id).toBe('sale-1')
  })

  it('returns null when not found', async () => {
    const res = await service.execute({ id: 'other' })
    expect(res.sale).toBeNull()
  })
})

