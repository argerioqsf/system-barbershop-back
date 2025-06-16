import { describe, it, expect, beforeEach } from 'vitest'
import { UpdateProductService } from '../../../src/services/product/update-product'
import { FakeProductRepository } from '../../helpers/fake-repositories'
import { makeProduct } from '../../helpers/default-values'

const product = makeProduct('p1', 20)

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
