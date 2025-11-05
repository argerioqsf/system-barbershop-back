import { describe, it, expect, beforeEach } from 'vitest'
import { ListCashSessionsUseCase } from '../../../../../src/modules/finance/application/use-cases/list-cash-sessions'
import {
  InMemoryCashRegisterRepository,
  FakeSaleRepository,
} from '../../../../helpers/fake-repositories'
import { InMemoryCashRegisterRepositoryAdapter } from '../../../../../src/modules/finance/infra/repositories/in-memory/in-memory-cash-register-repository'
import { CompatFakeTransactionRepository } from '../../../../helpers/compat-fake-transaction-repository'
import { session1, session2 } from '../../../../helpers/default-values'

describe('ListCashSessionsUseCase', () => {
  let legacyRepo: InMemoryCashRegisterRepository
  let adapter: InMemoryCashRegisterRepositoryAdapter
  let transactionsRepo: CompatFakeTransactionRepository
  let saleRepo: FakeSaleRepository
  let useCase: ListCashSessionsUseCase

  beforeEach(() => {
    legacyRepo = new InMemoryCashRegisterRepository()
    adapter = new InMemoryCashRegisterRepositoryAdapter(legacyRepo)
    adapter.legacy.sessions.push(session1, session2)
    transactionsRepo = new CompatFakeTransactionRepository()
    saleRepo = new FakeSaleRepository()
    useCase = new ListCashSessionsUseCase(adapter, transactionsRepo, saleRepo)
  })

  it('filtra sessões pela unidade quando não é owner', async () => {
    const result = await useCase.execute({
      actor: {
        sub: 'user-1',
        role: 'MANAGER',
        unitId: 'unit-2',
        organizationId: 'org-2',
      },
    })

    expect(result.sessions).toHaveLength(1)
    expect(result.sessions[0].id).toBe('s2')
  })

  it('filtra sessões pela organização quando for owner', async () => {
    const result = await useCase.execute({
      actor: {
        sub: 'user-1',
        role: 'OWNER',
        unitId: 'unit-2',
        organizationId: 'org-1',
      },
    })

    expect(result.sessions).toHaveLength(1)
    expect(result.sessions[0].id).toBe('s1')
  })

  it('lança erro quando usuário inválido', async () => {
    await expect(
      useCase.execute({
        actor: {
          sub: '',
          role: 'ADMIN',
          unitId: 'unit-1',
          organizationId: 'org-1',
        },
      }),
    ).rejects.toThrow('User not found')
  })
})
