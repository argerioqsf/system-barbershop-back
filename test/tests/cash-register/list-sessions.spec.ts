import { describe, it, expect, beforeEach } from 'vitest'
import { ListCashSessionsUseCase } from '../../../src/modules/finance/application/use-cases/list-cash-sessions'
import {
  InMemoryCashRegisterRepository,
  FakeSaleRepository,
} from '../../helpers/fake-repositories'
import { InMemoryCashRegisterRepositoryAdapter } from '../../../src/modules/finance/infra/repositories/in-memory/in-memory-cash-register-repository'
import { CompatFakeTransactionRepository } from '../../helpers/compat-fake-transaction-repository'
import { session1, session2 } from '../../helpers/default-values'

describe('List sessions service', () => {
  let adapter: InMemoryCashRegisterRepositoryAdapter
  let legacyRepo: InMemoryCashRegisterRepository
  let saleRepo: FakeSaleRepository
  let transactionsRepo: CompatFakeTransactionRepository
  let useCase: ListCashSessionsUseCase

  beforeEach(() => {
    legacyRepo = new InMemoryCashRegisterRepository()
    adapter = new InMemoryCashRegisterRepositoryAdapter(legacyRepo)
    adapter.legacy.sessions.push(session1, session2)
    saleRepo = new FakeSaleRepository()
    transactionsRepo = new CompatFakeTransactionRepository()
    useCase = new ListCashSessionsUseCase(adapter, transactionsRepo, saleRepo)
  })

  it('lists all for admin', async () => {
    const res = await useCase.execute({
      actor: {
        sub: '1',
        role: 'ADMIN',
        unitId: 'unit-1',
        organizationId: 'org-1',
      },
    })
    expect(res.sessions).toHaveLength(1)
  })

  it('filters by organization for owner', async () => {
    const res = await useCase.execute({
      actor: {
        sub: '1',
        role: 'OWNER',
        unitId: 'unit-1',
        organizationId: 'org-1',
      },
    })
    expect(res.sessions).toHaveLength(1)
    expect(res.sessions[0].id).toBe('s1')
  })

  it('filters by unit for others', async () => {
    const res = await useCase.execute({
      actor: {
        sub: '1',
        role: 'BARBER',
        unitId: 'unit-2',
        organizationId: 'org-2',
      },
    })
    expect(res.sessions).toHaveLength(1)
    expect(res.sessions[0].id).toBe('s2')
  })

  it('throws if user not found', async () => {
    await expect(
      useCase.execute({
        actor: {
          sub: '',
          role: 'ADMIN',
          unitId: 'u1',
          organizationId: 'o1',
        },
      }),
    ).rejects.toThrow('User not found')
  })
})
