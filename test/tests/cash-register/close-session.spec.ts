import { describe, it, expect, beforeEach } from 'vitest'
import { CloseSessionService } from '../../../src/services/cash-register/close-session'
import { InMemoryCashRegisterRepository } from '../../helpers/fake-repositories'
import { TransactionType } from '@prisma/client'
import { defaultUser } from '../../helpers/default-values'
import { CompleteCashSession } from '../../../src/repositories/cash-register-repository'

function makeSession(): CompleteCashSession {
  return {
    id: 's1',
    openedById: 'u1',
    unitId: 'unit-1',
    openedAt: new Date(),
    closedAt: null,
    initialAmount: 0,
    finalAmount: null,
    user: defaultUser,
    sales: [],
    transactions: [
      {
        id: 't1',
        userId: 'u1',
        affectedUserId: null,
        unitId: 'unit-1',
        cashRegisterSessionId: 's1',
        type: TransactionType.ADDITION,
        description: '',
        amount: 100,
        createdAt: new Date(),
        isLoan: true,
        receiptUrl: null,
        saleId: null,
      },
      {
        id: 't2',
        userId: 'u1',
        affectedUserId: null,
        unitId: 'unit-1',
        cashRegisterSessionId: 's1',
        type: TransactionType.WITHDRAWAL,
        description: '',
        amount: 40,
        createdAt: new Date(),
        isLoan: true,
        receiptUrl: null,
        saleId: null,
      },
    ],
  }
}

describe('Close session service', () => {
  let repo: InMemoryCashRegisterRepository
  let service: CloseSessionService

  beforeEach(() => {
    repo = new InMemoryCashRegisterRepository()
    service = new CloseSessionService(repo)
  })

  it('closes an open session calculating final amount', async () => {
    const session = makeSession()
    repo.sessions.push(session)

    const res = await service.execute({ unitId: 'unit-1' })
    expect(res.session.finalAmount).toBe(60)
    expect(repo.sessions[0].closedAt).toBeInstanceOf(Date)
  })

  it('throws when there is no open session', async () => {
    await expect(service.execute({ unitId: 'unit-1' })).rejects.toThrow(
      'Cash register not opened',
    )
  })
})
