import { describe, it, expect, beforeEach } from 'vitest'
import { DeleteProductService } from '../src/services/product/delete-product'
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

describe('Delete product service', () => {
  let repo: FakeProductRepository
  let service: DeleteProductService

  beforeEach(() => {
    repo = new FakeProductRepository([product])
    service = new DeleteProductService(repo)
  })

  it('removes product', async () => {
    await service.execute({ id: 'p1' })
    expect(repo.products).toHaveLength(0)
  })
})
