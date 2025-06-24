import { describe, it, expect, beforeEach } from 'vitest'
import { BarberBalanceService } from '../../../src/services/report/barber-balance'
import {
  FakeTransactionRepository,
  FakeBarberUsersRepository,
} from '../../helpers/fake-repositories'

import {
  barberUser,
  makeBalanceSale,
  makeTransaction,
} from '../../helpers/default-values'
import { TransactionType } from '@prisma/client'

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
      unit: {
        organizationId: 'org-1',
        allowsLoan: false,
        id: 'unit-1',
        name: 'unit 1',
        slotDuration: 30,
        slug: 'unit1',
        totalBalance: 0,
      },
    })

    const sale = makeBalanceSale()

    txRepo.transactions.push(
      makeTransaction({
        id: 't1',
        userId: 'u1',
        unitId: 'unit-1',
        amount: 100,
        organizationId: 'org-1',
        saleId: 'sale-1',

        sale,
        affectedUserId: null,
        cashRegisterSessionId: null,
        type: 'ADDITION',
        description: '',
        isLoan: false,
        receiptUrl: null,
        createdAt: new Date(),
      }),
      makeTransaction({
        id: 't2',
        userId: barberUser.id,
        unitId: 'unit-1',
        amount: 30,
        organizationId: 'org-1',
        saleId: 'sale-1',
        sale,
        affectedUserId: null,
        cashRegisterSessionId: null,
        type: 'ADDITION',
        description: '',
        isLoan: false,
        receiptUrl: null,
        createdAt: new Date(),
      }),
      makeTransaction({
        id: 't3',
        userId: barberUser.id,
        unitId: 'unit-1',
        type: TransactionType.WITHDRAWAL,
        amount: 20,
        organizationId: 'org-1',
        saleId: 'sale-1',
        sale,
        affectedUserId: null,
        cashRegisterSessionId: null,
        description: '',
        isLoan: false,
        receiptUrl: null,
        createdAt: new Date(),
      }),
    )
  })

  it('calculates balance and history', async () => {
    const res = await service.execute({ barberId: barberUser.id })
    expect(res.historySales).toHaveLength(3)
  })
})
