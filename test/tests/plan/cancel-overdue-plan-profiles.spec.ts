import { it, expect } from 'vitest'
import { CancelOverduePlanProfilesService } from '../../../src/services/plan/cancel-overdue-plan-profiles'
import {
  FakePlanProfileRepository,
  FakePlanRepository,
} from '../../helpers/fake-repositories'
import { makePlan } from '../../helpers/default-values'

it('cancels plan profile when last debt is overdue more than a month', async () => {
  const repo = new FakePlanProfileRepository([
    {
      id: 'pp1',
      planStartDate: new Date('2024-04-01'),
      status: 'EXPIRED',
      saleItemId: 'si1',
      dueDayDebt: 1,
      planId: 'plan1',
      profileId: 'prof1',
      debts: [
        {
          id: 'dpaid',
          value: 80,
          status: 'PAID',
          planId: 'plan1',
          planProfileId: 'pp1',
          paymentDate: new Date('2024-03-01'),
          dueDate: new Date('2024-04-01'),
          createdAt: new Date('2024-03-01'),
        },
      ],
    },
  ])
  const planRepo = new FakePlanRepository([makePlan('plan1', 80)])
  const service = new CancelOverduePlanProfilesService(repo, planRepo)
  await service.execute(new Date('2024-06-05'))

  expect(repo.items[0].status).toBe('CANCELED_EXPIRED')
})
