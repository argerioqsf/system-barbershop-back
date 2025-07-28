import { it, expect, vi } from 'vitest'
import { RenewPlanProfileService } from '../../../src/services/plan/renew-plan-profile'
import {
  FakePlanProfileRepository,
  FakePlanRepository,
  FakeDebtRepository,
  FakeProfilesRepository,
} from '../../helpers/fake-repositories'
import { makePlan, makeProfile } from '../../helpers/default-values'
import { PlanProfileStatus, PaymentStatus } from '@prisma/client'

it('renews expired plan profile and recalculates sales', async () => {
  const plan = makePlan('plan1', 80)
  const planRepo = new FakePlanRepository([plan as any])
  const profileRepo = new FakePlanProfileRepository([
    {
      id: 'pp1',
      planStartDate: new Date('2024-05-01'),
      status: PlanProfileStatus.EXPIRED,
      saleItemId: 'si1',
      dueDateDebt: 1,
      planId: plan.id,
      profileId: 'prof1',
      debts: [
        {
          id: 'd1',
          value: 80,
          status: PaymentStatus.PAID,
          planId: plan.id,
          planProfileId: 'pp1',
          paymentDate: new Date('2024-05-01'),
          createdAt: new Date('2024-05-01'),
        },
      ],
    },
  ])
  const debtRepo = new FakeDebtRepository([])
  const profilesRepo = new FakeProfilesRepository([
    makeProfile('prof1', 'u1') as any,
  ])
  const recalc = { execute: vi.fn() }
  const service = new RenewPlanProfileService(
    profileRepo,
    planRepo,
    debtRepo,
    profilesRepo,
    recalc as any,
  )

  const { planProfile } = await service.execute({ id: 'pp1' })

  expect(planProfile.status).toBe(PlanProfileStatus.PAID)
  expect(debtRepo.debts).toHaveLength(1)
  expect(recalc.execute).toHaveBeenCalledWith({ userIds: ['u1'] })
})

it('throws when plan profile is not expired', async () => {
  const plan = makePlan('plan1', 40)
  const planRepo = new FakePlanRepository([plan as any])
  const profileRepo = new FakePlanProfileRepository([
    {
      id: 'pp2',
      planStartDate: new Date(),
      status: PlanProfileStatus.PAID,
      saleItemId: 'si1',
      dueDateDebt: 1,
      planId: plan.id,
      profileId: 'prof1',
      debts: [],
    },
  ])
  const debtRepo = new FakeDebtRepository([])
  const profilesRepo = new FakeProfilesRepository([makeProfile('prof1', 'u1') as any])
  const recalc = { execute: vi.fn() }
  const service = new RenewPlanProfileService(
    profileRepo,
    planRepo,
    debtRepo,
    profilesRepo,
    recalc as any,
  )

  await expect(service.execute({ id: 'pp2' })).rejects.toThrow(
    'Plan profile is not expired',
  )
  expect(debtRepo.debts).toHaveLength(0)
  expect(recalc.execute).not.toHaveBeenCalled()
})
