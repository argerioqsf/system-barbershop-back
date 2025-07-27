import { it, expect } from 'vitest'
import { UpdatePlanProfilesStatusService } from '../../../src/services/plan/update-plan-profiles-status'
import { FakePlanProfileRepository } from '../../helpers/fake-repositories'

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

  const service = new UpdatePlanProfilesStatusService(repo)
  await service.execute(new Date('2024-06-10'))

  expect(repo.items[0].status).toBe('DEFAULTED')
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

  const service = new UpdatePlanProfilesStatusService(repo)
  await service.execute(new Date('2024-06-10'))

  expect(repo.items[0].status).toBe('CANCELED')
})
