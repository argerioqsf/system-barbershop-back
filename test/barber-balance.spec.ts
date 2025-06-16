import { describe, it, expect, beforeEach } from 'vitest'
import { BarberBalanceService } from '../src/services/report/barber-balance'
import {
  FakeTransactionRepository,
  FakeBarberUsersRepository,
} from './helpers/fake-repositories'

import { barberUser } from './helpers/default-values'

describe('Barber balance service', () => {
  let txRepo: FakeTransactionRepository
  let userRepo: FakeBarberUsersRepository
  let service: BarberBalanceService

  beforeEach(() => {
    txRepo = new FakeTransactionRepository()
    userRepo = new FakeBarberUsersRepository()
    service = new BarberBalanceService(txRepo, userRepo)

    userRepo.users.push({
      ...barberUser,
      unit: { organizationId: 'org-1' },
    })

    const sale = {
      items: [
        {
          barberId: barberUser.id,
          price: 100,
          porcentagemBarbeiro: 50,
          productId: null,
          service: { name: 'Cut' },
          coupon: null,
        },
      ],
      coupon: null,
    }

    txRepo.transactions.push(
      {
        id: 't1',
        userId: 'u1',
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
        userId: barberUser.id,
        unitId: 'unit-1',
        type: 'ADDITION',
        description: '',
        amount: 30,
        createdAt: new Date(),
        sale: null,
        unit: { organizationId: 'org-1' },
      } as any,
      {
        id: 't3',
        userId: barberUser.id,
        unitId: 'unit-1',
        type: 'WITHDRAWAL',
        description: '',
        amount: 20,
        createdAt: new Date(),
        sale: null,
        unit: { organizationId: 'org-1' },
      } as any,
    )
  })

  it('calculates balance and history', async () => {
    const res = await service.execute({ barberId: barberUser.id })
    expect(res.balance).toBeCloseTo(60)
    expect(res.historySales).toHaveLength(3)
  })
})

