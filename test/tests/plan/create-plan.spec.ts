import { describe, it, expect } from 'vitest'
import { CreatePlanService } from '../../../src/services/plan/create-plan'
import { FakePlanRepository } from '../../helpers/fake-repositories'

describe('Create plan service', () => {
  it('creates plan with benefits', async () => {
    const repo = new FakePlanRepository()
    const service = new CreatePlanService(repo)
    const result = await service.execute({
      name: 'P',
      price: 10,
      typeRecurrenceId: 'rec1',
      benefitIds: ['b1', 'b2'],
      unitId: 'unit-1',
    })
    const stored = repo.plans[0]
    expect((stored as any).benefits).toHaveLength(2)
    expect((stored as any).benefits[0].benefitId).toBe('b1')
    expect((stored as any).unitId).toBe('unit-1')
    expect(result.plan.name).toBe('P')
  })
})
