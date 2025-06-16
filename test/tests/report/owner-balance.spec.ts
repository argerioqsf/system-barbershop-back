import { describe, it, expect, beforeEach } from 'vitest'
import { OwnerBalanceService } from '../../../src/services/report/owner-balance'
import {
  FakeTransactionRepository,
  FakeBarberUsersRepository,
} from '../../helpers/fake-repositories'
import { makeBalanceSale, makeTransaction, namedUser } from '../../helpers/default-values'
import { TransactionType } from '@prisma/client'

describe('Owner balance service', () => {
  let txRepo: FakeTransactionRepository
  let userRepo: FakeBarberUsersRepository
  let service: OwnerBalanceService

  beforeEach(() => {
    txRepo = new FakeTransactionRepository()
    userRepo = new FakeBarberUsersRepository()
    service = new OwnerBalanceService(txRepo, userRepo)

    const owner = { ...namedUser, id: 'owner1', unit: { organizationId: 'org-1' } }
    userRepo.users.push(owner as any)

    const sale = makeBalanceSale('b1')

    txRepo.transactions.push(
      makeTransaction({ id: 't1', userId: 'x', unitId: 'unit-1', amount: 100, sale, organizationId: 'org-1' }),
      makeTransaction({ id: 't2', userId: 'owner1', unitId: 'unit-1', amount: 20, organizationId: 'org-1' }),
      makeTransaction({ id: 't3', userId: 'owner1', unitId: 'unit-1', type: TransactionType.WITHDRAWAL, amount: 10, organizationId: 'org-1' }),
    )
  })

  it('calculates owner balance', async () => {
    const res = await service.execute({ ownerId: 'owner1' })
    expect(res.balance).toBeCloseTo(60)
    expect(res.historySales.length).toBe(3)
  })
})

