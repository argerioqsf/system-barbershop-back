import { describe, it, expect, beforeEach } from 'vitest'
import { UpdateProductService } from '../src/services/product/update-product'
import { FakeProductRepository } from './helpers/fake-repositories'

const product = {
  id: 'p1',
  name: 'Prod',
  description: null,
  imageUrl: null,
  quantity: 5,
  cost: 10,
  price: 20,
  unitId: 'unit-1',
} as any

describe('Update product service', () => {
  let repo: FakeProductRepository
  let service: UpdateProductService

  beforeEach(() => {
    repo = new FakeProductRepository([product])
    service = new UpdateProductService(repo)
  })

  it('updates product data', async () => {
    const res = await service.execute({ id: 'p1', data: { name: 'New', quantity: { decrement: 1 } } })
    expect(res.product.name).toBe('New')
    expect(repo.products[0].quantity).toBe(4)
  })
})
