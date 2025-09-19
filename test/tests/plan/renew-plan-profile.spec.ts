import { it, expect, vi } from 'vitest'
import { prisma } from '../../../src/lib/prisma'
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
  vi.spyOn(prisma, '$transaction').mockImplementation(async (fn) =>
    fn({} as unknown as import('@prisma/client').Prisma.TransactionClient),
  )
  const plan = makePlan('plan1', 80)
  const planRepo = new FakePlanRepository([plan])
  const profileRepo = new FakePlanProfileRepository([
    {
      id: 'pp1',
      planStartDate: new Date('2024-05-01'),
      status: PlanProfileStatus.EXPIRED,
      saleItemId: 'si1',
      dueDayDebt: 1,
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
          dueDate: new Date('2024-06-01'),
          createdAt: new Date('2024-05-01'),
        },
      ],
    },
  ])
  const debtRepo = new FakeDebtRepository([])
  const profilesRepo = new FakeProfilesRepository([
    makeProfile('prof1', 'u1'),
  ])
  const recalc = { execute: vi.fn() }
  const service = new RenewPlanProfileService(
    profileRepo,
    planRepo,
    debtRepo,
    profilesRepo,
    (recalc as unknown as import('../../../src/services/sale/recalculate-user-sales').RecalculateUserSalesService),
  )

  const { planProfile } = await service.execute({ id: 'pp1' })

  expect(planProfile.status).toBe(PlanProfileStatus.PAID)
  expect(debtRepo.debts).toHaveLength(1)
  expect(recalc.execute).toHaveBeenCalledWith(
    { userIds: ['u1'] },
    expect.anything(),
  )
})

it('throws when plan profile is not expired', async () => {
  vi.spyOn(prisma, '$transaction').mockImplementation(async (fn) =>
    fn({} as unknown as import('@prisma/client').Prisma.TransactionClient),
  )
  const plan = makePlan('plan1', 40)
  const planRepo = new FakePlanRepository([plan])
  const profileRepo = new FakePlanProfileRepository([
    {
      id: 'pp2',
      planStartDate: new Date(),
      status: PlanProfileStatus.PAID,
      saleItemId: 'si1',
      dueDayDebt: 1,
      planId: plan.id,
      profileId: 'prof1',
      debts: [],
    },
  ])
  const debtRepo = new FakeDebtRepository([])
  const profilesRepo = new FakeProfilesRepository([
    makeProfile('prof1', 'u1'),
  ])
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
