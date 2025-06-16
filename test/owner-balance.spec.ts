import { describe, it, expect, beforeEach } from 'vitest'
import { OwnerBalanceService } from '../src/services/report/owner-balance'
import {
  FakeTransactionRepository,
  FakeBarberUsersRepository,
} from './helpers/fake-repositories'

describe('Owner balance service', () => {
  let txRepo: FakeTransactionRepository
  let userRepo: FakeBarberUsersRepository
  let service: OwnerBalanceService

  beforeEach(() => {
    txRepo = new FakeTransactionRepository()
    userRepo = new FakeBarberUsersRepository()
    service = new OwnerBalanceService(txRepo, userRepo)

    const owner = {
      id: 'owner1',
      name: '',
      email: '',
      password: '',
      active: true,
      organizationId: 'org-1',
      unitId: 'unit-1',
      createdAt: new Date(),
      profile: null,
      unit: { organizationId: 'org-1' },
    }
    userRepo.users.push(owner as any)

    const sale = {
      items: [
        {
          price: 100,
          barberId: 'b1',
          porcentagemBarbeiro: 50,
          service: { name: 'Cut' },
          productId: null,
          quantity: 1,
          coupon: null,
        },
      ],
      coupon: null,
    }

    txRepo.transactions.push(
      {
        id: 't1',
        userId: 'x',
        unitId: 'unit-1',
        type: 'ADDITION',
        description: '',
        amount: 100,
        createdAt: new Date(),
        sale,
        unit: { organizationId: 'org-1' },
      } as any,
      {
        id: 't2',
        userId: 'owner1',
        unitId: 'unit-1',
        type: 'ADDITION',
        description: '',
        amount: 20,
        createdAt: new Date(),
        sale: null,
        unit: { organizationId: 'org-1' },
      } as any,
      {
        id: 't3',
        userId: 'owner1',
        unitId: 'unit-1',
        type: 'WITHDRAWAL',
        description: '',
        amount: 10,
        createdAt: new Date(),
        sale: null,
        unit: { organizationId: 'org-1' },
      } as any,
    )
  })

  it('calculates owner balance', async () => {
    const res = await service.execute({ ownerId: 'owner1' })
    expect(res.balance).toBeCloseTo(60)
    expect(res.historySales.length).toBe(3)
  })
})

