import { describe, it, expect, beforeEach, vi } from 'vitest'
import { UpdateSaleService } from '../../../src/services/sale/update-sale'
import { FakeSaleRepository } from '../../helpers/fake-repositories'
import { makeSale } from '../../helpers/default-values'
import { PaymentMethod } from '@prisma/client'
import { prisma } from '../../../src/lib/prisma'

vi.mock('../../../src/services/@factories/sale/make-update-sale', () => ({
  makeUpdateSale: () => new UpdateSaleService(new FakeSaleRepository()),
}))

describe('Update sale service', () => {
  let repo: FakeSaleRepository
  let service: UpdateSaleService

  beforeEach(() => {
    repo = new FakeSaleRepository()
    repo.sales.push(makeSale('sale-up-1'))
    service = new UpdateSaleService(repo)
    vi.spyOn(prisma, '$transaction').mockImplementation(async (fn) => fn({} as any))
  })

  it('updates sale method', async () => {
    const res = await service.execute({
      id: 'sale-up-1',
      method: PaymentMethod.PIX,
      observation: 'new',
    })
    expect(res.sale?.method).toBe(PaymentMethod.PIX)
    expect(res.sale?.observation).toBe('new')
  })

  it('throws when sale already paid', async () => {
    repo.sales[0].paymentStatus = 'PAID'
    await expect(service.execute({ id: 'sale-up-1' })).rejects.toThrow('Cannot edit a paid sale')
  })
})
