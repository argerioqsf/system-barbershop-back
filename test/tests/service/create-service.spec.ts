import { describe, it, expect, beforeEach } from 'vitest'
import { CreateServiceService } from '../../../src/services/service/create-service'
import { FakeServiceRepository } from '../../helpers/fake-repositories'

describe('Create service service', () => {
  let repo: FakeServiceRepository
  let service: CreateServiceService

  beforeEach(() => {
    repo = new FakeServiceRepository([])
    service = new CreateServiceService(repo)
  })

  it('creates a service', async () => {
    const result = await service.execute({
      name: 'Cut',
      description: null,
      imageUrl: null,
      cost: 10,
      price: 20,
      categoryId: 'cat-1',
      unitId: 'unit-1',
    })
    expect(result.service.name).toBe('Cut')
    expect(repo.services).toHaveLength(1)
    expect(repo.services[0].unitId).toBe('unit-1')
  })

  it('creates a service with optional fields', async () => {
    const result = await service.execute({
      name: 'Deluxe',
      description: 'desc',
      imageUrl: null,
      cost: 15,
      price: 40,
      categoryId: 'hair',
      defaultTime: 30,
      commissionPercentage: 80,
      unitId: 'unit-1',
    })
    expect(result.service.categoryId).toBe('hair')
    expect(result.service.defaultTime).toBe(30)
    expect(result.service.commissionPercentage).toBe(80)
    expect(repo.services[0].commissionPercentage).toBe(80)
  })
})
