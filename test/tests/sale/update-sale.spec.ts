import { describe, it, expect, beforeEach } from 'vitest'
import { UpdateSaleService } from '../../../src/services/sale/update-sale'
import { FakeSaleRepository } from '../../helpers/fake-repositories'
import { makeSale } from '../../helpers/default-values'
import { PaymentMethod } from '@prisma/client'

const sale = makeSale('sale-up-1')

describe('Update sale service', () => {
  let repo: FakeSaleRepository
  let service: UpdateSaleService

  beforeEach(() => {
    repo = new FakeSaleRepository()
    repo.sales.push(sale)
    service = new UpdateSaleService(repo)
  })

  it('updates sale data', async () => {
    const res = await service.execute({
      id: 'sale-up-1',
      data: { method: PaymentMethod.PIX },
    })
    expect(res.sale.method).toBe(PaymentMethod.PIX)
    expect(repo.sales[0].method).toBe(PaymentMethod.PIX)
  })
})
