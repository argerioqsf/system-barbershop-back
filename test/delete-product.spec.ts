import { describe, it, expect, beforeEach } from 'vitest'
import { DeleteProductService } from '../src/services/product/delete-product'
import { FakeProductRepository } from './helpers/fake-repositories'
import { makeProduct } from './helpers/default-values'

const product = makeProduct('p1', 20)

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
