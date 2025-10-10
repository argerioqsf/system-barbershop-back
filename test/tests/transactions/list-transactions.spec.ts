import { describe, it, expect, beforeEach } from 'vitest'
import { ListTransactionsService } from '../../../src/services/transaction/list-transactions'
import { FakeTransactionRepository } from '../../helpers/fake-repositories'
import { defaultSale, makeTransaction } from '../../helpers/default-values'

describe('List transactions service', () => {
  let repo: FakeTransactionRepository
  let service: ListTransactionsService

  beforeEach(() => {
    repo = new FakeTransactionRepository()
    repo.transactions.push(
      makeTransaction({
        id: 't1',
        unitId: 'unit-1',
        organizationId: 'org-1',
        sale: defaultSale,
        userId: '',
        affectedUserId: null,
        cashRegisterSessionId: null,
        type: 'ADDITION',
        description: '',
        amount: 0,
        isLoan: false,
        receiptUrl: null,
        createdAt: new Date(),
        saleId: null,
      }),
    )
    repo.transactions.push(
      makeTransaction({
        id: 't2',
        unitId: 'unit-2',
        organizationId: 'org-2',
        sale: defaultSale,
        userId: '',
        affectedUserId: null,
        cashRegisterSessionId: null,
        type: 'ADDITION',
        description: '',
        amount: 0,
        isLoan: false,
        receiptUrl: null,
        createdAt: new Date(),
        saleId: null,
      }),
    )
    service = new ListTransactionsService(repo)
  })

  it('lists transactions for admin', async () => {
    const res = await service.execute({
      sub: '1',
      role: 'ADMIN',
      unitId: 'unit-1',
      organizationId: 'org-1',
    })
    expect(res.transactions).toHaveLength(1)
  })

  it('filters by organization for owner', async () => {
    const res = await service.execute({
      sub: '1',
      role: 'OWNER',
      unitId: 'unit-1',
      organizationId: 'org-1',
    })
    expect(res.transactions).toHaveLength(1)
    expect(res.transactions[0].id).toBe('t1')
  })

  it('filters by unit for others', async () => {
    const res = await service.execute({
      sub: '1',
      role: 'BARBER',
      unitId: 'unit-2',
      organizationId: 'org-2',
    })
    expect(res.transactions).toHaveLength(1)
    expect(res.transactions[0].id).toBe('t2')
  })

  it('throws if user not found', async () => {
    await expect(
      service.execute({
        sub: '',
        role: 'ADMIN',
        unitId: 'unit-1',
        organizationId: 'org-1',
      }),
    ).rejects.toThrow('User not found')
  })
})
