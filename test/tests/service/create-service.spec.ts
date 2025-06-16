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
      unitId: 'unit-1',
    })
    expect(result.service.name).toBe('Cut')
    expect(repo.services).toHaveLength(1)
    expect(repo.services[0].unitId).toBe('unit-1')
  })
})
