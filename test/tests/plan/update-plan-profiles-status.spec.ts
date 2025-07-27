import { it, expect, vi } from 'vitest'
import { UpdatePlanProfilesStatusService } from '../../../src/services/plan/update-plan-profiles-status'
import { FakePlanProfileRepository, FakeProfilesRepository } from '../../helpers/fake-repositories'
import { makeProfile } from '../../helpers/default-values'

it('marks plan profile as DEFAULTED if there is overdue debt', async () => {
  const repo = new FakePlanProfileRepository([
    {
      id: 'pp1',
      planStartDate: new Date('2024-06-01'),
      status: 'PAID',
      saleItemId: 'si1',
      dueDateDebt: 5,
      planId: 'plan1',
      profileId: 'prof1',
      debts: [
        {
          id: 'd1',
          value: 80,
          status: 'PENDING',
          planId: 'plan1',
          planProfileId: 'pp1',
          paymentDate: new Date('2024-06-05'),
          createdAt: new Date('2024-06-01'),
        },
      ],
    },
  ])
  const profilesRepo = new FakeProfilesRepository([makeProfile('prof1', 'u1') as any])
  const recalc = { execute: vi.fn() }
  const service = new UpdatePlanProfilesStatusService(repo, profilesRepo, recalc as any)
  await service.execute(new Date('2024-06-10'))

  expect(repo.items[0].status).toBe('DEFAULTED')
  expect(recalc.execute).toHaveBeenCalledWith({ userIds: ['u1'] })
})

it('does not change status when plan profile is canceled', async () => {
  const repo = new FakePlanProfileRepository([
    {
      id: 'pp2',
      planStartDate: new Date('2024-06-01'),
      status: 'CANCELED',
      saleItemId: 'si1',
      dueDateDebt: 5,
      planId: 'plan1',
      profileId: 'prof1',
      debts: [
        {
          id: 'd1',
          value: 80,
          status: 'PENDING',
          planId: 'plan1',
          planProfileId: 'pp2',
          paymentDate: new Date('2024-06-05'),
          createdAt: new Date('2024-06-01'),
        },
      ],
    },
  ])
  const profilesRepo = new FakeProfilesRepository([makeProfile('prof1', 'u1') as any])
  const recalc = { execute: vi.fn() }
  const service = new UpdatePlanProfilesStatusService(repo, profilesRepo, recalc as any)
  await service.execute(new Date('2024-06-10'))

  expect(repo.items[0].status).toBe('CANCELED')
  expect(recalc.execute).not.toHaveBeenCalled()
})
