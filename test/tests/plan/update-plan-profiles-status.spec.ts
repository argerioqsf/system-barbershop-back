import { it, expect, vi } from 'vitest'
import { UpdatePlanProfilesStatusService } from '../../../src/services/plan/update-plan-profiles-status'
import { prisma } from '../../../src/lib/prisma'
import { FakePlanProfileRepository, FakeProfilesRepository } from '../../helpers/fake-repositories'
import { makeProfile } from '../../helpers/default-values'

it('marks plan profile as EXPIRED if there is overdue debt', async () => {
  const repo = new FakePlanProfileRepository([
    {
      id: 'pp1',
      planStartDate: new Date('2024-06-01'),
      status: 'PAID',
      saleItemId: 'si1',
      dueDayDebt: 5,
      planId: 'plan1',
      profileId: 'prof1',
      debts: [
        {
          id: 'dp',
          value: 80,
          status: 'PAID',
          planId: 'plan1',
          planProfileId: 'pp1',
          paymentDate: new Date('2024-06-01'),
          dueDate: new Date('2024-06-05'),
          createdAt: new Date('2024-06-01'),
        },
        {
          id: 'd1',
          value: 80,
          status: 'PENDING',
          planId: 'plan1',
          planProfileId: 'pp1',
          paymentDate: null as any,
          dueDate: new Date('2024-06-05'),
          createdAt: new Date('2024-06-01'),
        },
      ],
    },
  ])
  const profilesRepo = new FakeProfilesRepository([
    makeProfile('prof1', 'u1'),
  ])
  const recalc = { execute: vi.fn() }
  const service = new UpdatePlanProfilesStatusService(
    repo,
    profilesRepo,
    (recalc as unknown as import('../../../src/modules/sale/application/use-cases/recalculate-user-sales').RecalculateUserSalesService),
  )
  vi.spyOn(prisma, '$transaction').mockImplementation(async (fn) =>
    fn({} as unknown as import('@prisma/client').Prisma.TransactionClient),
  )
  await service.execute(new Date('2024-06-10'))

  expect(repo.items[0].status).toBe('EXPIRED')
  expect(recalc.execute).toHaveBeenCalledWith(
    { userIds: ['u1'] },
    expect.anything(),
  )
})

it('does not change status when plan profile is canceled', async () => {
  const repo = new FakePlanProfileRepository([
    {
      id: 'pp2',
      planStartDate: new Date('2024-06-01'),
      status: 'CANCELED_EXPIRED',
      saleItemId: 'si1',
      dueDayDebt: 5,
      planId: 'plan1',
      profileId: 'prof1',
      debts: [
        {
          id: 'dp2',
          value: 80,
          status: 'PAID',
          planId: 'plan1',
          planProfileId: 'pp2',
          paymentDate: new Date('2024-06-01'),
          dueDate: new Date('2024-06-05'),
          createdAt: new Date('2024-06-01'),
        },
        {
          id: 'd1',
          value: 80,
          status: 'PENDING',
          planId: 'plan1',
          planProfileId: 'pp2',
          paymentDate: null as any,
          dueDate: new Date('2024-06-05'),
          createdAt: new Date('2024-06-01'),
        },
      ],
    },
  ])
  const profilesRepo = new FakeProfilesRepository([
    makeProfile('prof1', 'u1'),
  ])
  const recalc = { execute: vi.fn() }
  const service = new UpdatePlanProfilesStatusService(
    repo,
    profilesRepo,
    (recalc as unknown as import('../../../src/modules/sale/application/use-cases/recalculate-user-sales').RecalculateUserSalesService),
  )
  vi.spyOn(prisma, '$transaction').mockImplementation(async (fn) =>
    fn({} as unknown as import('@prisma/client').Prisma.TransactionClient),
  )
  await service.execute(new Date('2024-06-10'))

  expect(repo.items[0].status).toBe('CANCELED_EXPIRED')
  expect(recalc.execute).not.toHaveBeenCalled()
})

it('marks CANCELED_ACTIVE plan as CANCELED_EXPIRED when last debt expired', async () => {
  const repo = new FakePlanProfileRepository([
    {
      id: 'pp3',
      planStartDate: new Date('2024-06-01'),
      status: 'CANCELED_ACTIVE',
      saleItemId: 'si1',
      dueDayDebt: 5,
      planId: 'plan1',
      profileId: 'prof1',
      debts: [
        {
          id: 'd1',
          value: 80,
          status: 'PAID',
          planId: 'plan1',
          planProfileId: 'pp3',
          paymentDate: new Date('2024-05-05'),
          dueDate: new Date('2024-06-05'),
          createdAt: new Date('2024-05-05'),
        },
      ],
    },
  ])
  const profilesRepo = new FakeProfilesRepository([
    makeProfile('prof1', 'u1'),
  ])
  const recalc = { execute: vi.fn() }
  const service = new UpdatePlanProfilesStatusService(
    repo,
    profilesRepo,
    (recalc as unknown as import('../../../src/modules/sale/application/use-cases/recalculate-user-sales').RecalculateUserSalesService),
  )
  vi.spyOn(prisma, '$transaction').mockImplementation(async (fn) =>
    fn({} as unknown as import('@prisma/client').Prisma.TransactionClient),
  )
  await service.execute(new Date('2024-06-10'))

  expect(repo.items[0].status).toBe('CANCELED_EXPIRED')
  expect(recalc.execute).toHaveBeenCalledWith(
    { userIds: ['u1'] },
    expect.anything(),
  )
})
