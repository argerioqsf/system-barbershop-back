import { it, expect, vi, beforeEach } from 'vitest'
import { CancelPlanProfileService } from '../../../src/services/plan/cancel-plan-profile'
import { FakePlanProfileRepository, FakeProfilesRepository } from '../../helpers/fake-repositories'
import { makeProfile } from '../../helpers/default-values'
import { PlanProfileStatus, PaymentStatus } from '@prisma/client'

let repo: FakePlanProfileRepository
let profilesRepo: FakeProfilesRepository
let recalc: { execute: ReturnType<typeof vi.fn> }
let service: CancelPlanProfileService

beforeEach(() => {
  repo = new FakePlanProfileRepository([
    {
      id: 'pp1',
      planStartDate: new Date('2024-01-01'),
      status: PlanProfileStatus.PAID,
      saleItemId: 's1',
      dueDateDebt: 1,
      planId: 'pl1',
      profileId: 'prof1',
      debts: [
        {
          id: 'd1',
          value: 50,
          status: PaymentStatus.PAID,
          planId: 'pl1',
          planProfileId: 'pp1',
          paymentDate: new Date('2024-02-01'),
          createdAt: new Date('2024-01-01'),
        },
      ],
    },
  ])
  profilesRepo = new FakeProfilesRepository([makeProfile('prof1', 'u1') as any])
  recalc = { execute: vi.fn() }
  service = new CancelPlanProfileService(repo, profilesRepo, recalc as any)
})

it('cancels expired plan profile and recalculates sales', async () => {
  repo.items[0].status = PlanProfileStatus.EXPIRED

  const { planProfile } = await service.execute({ id: 'pp1' })

  expect(planProfile.status).toBe(PlanProfileStatus.CANCELED_EXPIRED)
  expect(recalc.execute).toHaveBeenCalledWith({ userIds: ['u1'] })
})

it('cancels active plan profile without recalculating sales', async () => {
  const { planProfile } = await service.execute({ id: 'pp1' })

  expect(planProfile.status).toBe(PlanProfileStatus.CANCELED_ACTIVE)
  expect(recalc.execute).not.toHaveBeenCalled()
})
