import { describe, it, expect, beforeEach } from 'vitest'
import { CreateProductService } from '../src/services/product/create-product'
import { FakeProductRepository } from './helpers/fake-repositories'

describe('Create product service', () => {
  let repo: FakeProductRepository
  let service: CreateProductService

  beforeEach(() => {
    repo = new FakeProductRepository([])
    service = new CreateProductService(repo)
  })

  it('creates a product', async () => {
    const result = await service.execute({
      name: 'Prod',
      description: null,
      imageUrl: null,
      quantity: 5,
      cost: 10,
      price: 20,
      unitId: 'unit-1',
    })
    expect(result.product.name).toBe('Prod')
    expect(repo.products).toHaveLength(1)
    expect(repo.products[0].unitId).toBe('unit-1')
  })
})
