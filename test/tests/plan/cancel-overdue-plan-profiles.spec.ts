import { it, expect, vi } from 'vitest'
import { CancelOverduePlanProfilesService } from '../../../src/services/plan/cancel-overdue-plan-profiles'
import { FakePlanProfileRepository, FakeProfilesRepository } from '../../helpers/fake-repositories'
import { makeProfile } from '../../helpers/default-values'

it('cancels plan profile when last debt is overdue more than a month', async () => {
  const repo = new FakePlanProfileRepository([
    {
      id: 'pp1',
      planStartDate: new Date('2024-04-01'),
      status: 'DEFAULTED',
      saleItemId: 'si1',
      dueDateDebt: 1,
      planId: 'plan1',
      profileId: 'prof1',
      debts: [
        {
          id: 'd1',
          value: 80,
          status: 'PENDING',
          planId: 'plan1',
          planProfileId: 'pp1',
          paymentDate: new Date('2024-04-01'),
          createdAt: new Date('2024-04-01'),
        },
      ],
    },
  ])
  const profilesRepo = new FakeProfilesRepository([
    makeProfile('prof1', 'u1') as any,
  ])
  const recalc = { execute: vi.fn() }
  const service = new CancelOverduePlanProfilesService(
    repo,
    profilesRepo,
    recalc as any,
  )
  await service.execute(new Date('2024-06-05'))

  expect(repo.items[0].status).toBe('CANCELED')
  expect(recalc.execute).toHaveBeenCalledWith({ userIds: ['u1'] })
})
