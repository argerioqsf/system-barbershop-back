import { describe, it, expect } from 'vitest'
import { GeneratePlanDebtsService } from '../../../src/services/plan/generate-plan-debts'
import { FakePlanProfileRepository, FakePlanRepository, FakeDebtRepository } from '../../helpers/fake-repositories'
import { makePlan } from '../../helpers/default-values'

it('creates pending debt when next due date is in 20 days', async () => {
  const planRepo = new FakePlanRepository([makePlan('plan1', 100)])
  const profileRepo = new FakePlanProfileRepository([
    {
      id: 'pp1',
      planStartDate: new Date('2024-06-28'),
      status: 'PAID',
      saleItemId: 'si1',
      dueDayDebt: 28,
      planId: 'plan1',
      profileId: 'pr1',
      debts: [
        {
          id: 'd1',
          value: 80,
          status: 'PAID',
          planId: 'plan1',
          planProfileId: 'pp1',
          paymentDate: new Date('2024-06-28'),
          dueDate: new Date('2024-07-28'),
          createdAt: new Date('2024-06-28'),
        },
      ],
    },
  ])
  const debtRepo = new FakeDebtRepository([])

  const service = new GeneratePlanDebtsService(profileRepo, planRepo, debtRepo)
  await service.execute(new Date('2024-07-08'))

  expect(debtRepo.debts).toHaveLength(1)
  expect(debtRepo.debts[0].status).toBe('PENDING')
  expect(debtRepo.debts[0].dueDate.toISOString()).toBe(new Date('2024-07-28').toISOString())
})
