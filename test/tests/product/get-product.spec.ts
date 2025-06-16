import { describe, it, expect, beforeEach } from 'vitest'
import { GetProductService } from '../../../src/services/product/get-product'
import { FakeProductRepository } from '../../helpers/fake-repositories'
import { makeProduct } from '../../helpers/default-values'

const product = makeProduct('p1', 20)

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
