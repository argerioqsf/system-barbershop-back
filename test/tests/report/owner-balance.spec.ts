import { describe, it, expect, beforeEach } from 'vitest'
import { OwnerBalanceService } from '../../../src/services/report/owner-balance'
import {
  FakeTransactionRepository,
  FakeBarberUsersRepository,
} from '../../helpers/fake-repositories'
import {
  makeBalanceSale,
  makeTransaction,
  namedUser,
} from '../../helpers/default-values'
import {
  BarberService,
  Permission,
  Profile,
  ProfileBlockedHour,
  ProfileWorkHour,
  Role,
  TransactionType,
  Unit,
  User,
} from '@prisma/client'

describe('Owner balance service', () => {
  let txRepo: FakeTransactionRepository
  let userRepo: FakeBarberUsersRepository
  let service: OwnerBalanceService

  beforeEach(() => {
    txRepo = new FakeTransactionRepository()
    userRepo = new FakeBarberUsersRepository()
    service = new OwnerBalanceService(txRepo, userRepo)

    const owner: User & {
      unit: Unit
      profile:
        | (Profile & {
            permissions: Permission[]
            role: Role
            workHours: ProfileWorkHour[]
            blockedHours: ProfileBlockedHour[]
            barberServices: BarberService[]
          })
        | null
    } = {
      ...namedUser,
      id: 'owner1',
      unit: {
        organizationId: 'org-1',
        allowsLoan: true,
        id: 'unit-1',
        name: 'unit',
        slotDuration: 30,
        slug: 'unit1',
        totalBalance: 0,
      },
    }
    userRepo.users.push(owner)

    const sale = makeBalanceSale('b1')

    txRepo.transactions.push(
      makeTransaction({
        id: 't1',
        userId: 'x',
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
        userId: 'owner1',
        unitId: 'unit-1',
        amount: 20,
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
        userId: 'owner1',
        unitId: 'unit-1',
        type: TransactionType.WITHDRAWAL,
        amount: 10,
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

  it('calculates owner balance', async () => {
    const res = await service.execute({ ownerId: 'owner1' })
    expect(res.balance).toBeCloseTo(190)
    expect(res.historySales.length).toBe(3)
  })
})
