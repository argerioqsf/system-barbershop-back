import { describe, it, expect, beforeEach } from 'vitest'
import { GetProductService } from '../src/services/product/get-product'
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

describe('Get product service', () => {
  let repo: FakeProductRepository
  let service: GetProductService

  beforeEach(() => {
    repo = new FakeProductRepository([product])
    service = new GetProductService(repo)
  })

  it('returns product when found', async () => {
    const res = await service.execute({ id: 'p1' })
    expect(res.product?.id).toBe('p1')
  })

  it('returns null when not found', async () => {
    const res = await service.execute({ id: 'other' })
    expect(res.product).toBeNull()
  })
})
