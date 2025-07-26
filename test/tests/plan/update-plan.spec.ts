import { describe, it, expect, beforeEach } from 'vitest'
import { UpdatePlanService } from '../../../src/services/plan/update-plan'
import { FakePlanRepository, FakePlanProfileRepository, FakeProfilesRepository } from '../../helpers/fake-repositories'
import { RecalculateUserSalesService } from '../../../src/services/sale/recalculate-user-sales'
import { FakeSaleRepository, FakeSaleItemRepository, FakeCouponRepository } from '../../helpers/fake-repositories'

const plan = {
  id: 'p1',
  price: 10,
  name: 'Old',
  typeRecurrenceId: 'rec1',
  benefits: [],
}

describe('Update plan service', () => {
  let repo: FakePlanRepository
  let planProfileRepo: FakePlanProfileRepository
  let profilesRepo: FakeProfilesRepository
  let recalc: RecalculateUserSalesService
  let service: UpdatePlanService

  beforeEach(() => {
    repo = new FakePlanRepository([plan as any])
    planProfileRepo = new FakePlanProfileRepository()
    profilesRepo = new FakeProfilesRepository()
    const saleRepo = new FakeSaleRepository()
    const saleItemRepo = new FakeSaleItemRepository(saleRepo)
    const couponRepo = new FakeCouponRepository()
    recalc = new RecalculateUserSalesService(
      saleRepo,
      saleItemRepo,
      repo,
      planProfileRepo,
      couponRepo,
    )
    service = new UpdatePlanService(repo, planProfileRepo, profilesRepo, recalc)
  })

  it('updates benefits list', async () => {
    await service.execute({ id: 'p1', data: {}, benefitIds: ['b1'] })
    const stored = repo.plans[0] as any
    expect(stored.benefits).toHaveLength(1)
    expect(stored.benefits[0].benefitId).toBe('b1')
  })
})
