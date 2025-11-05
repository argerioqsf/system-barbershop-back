import { describe, it, expect, beforeEach } from 'vitest'
import { CloseCashSessionUseCase } from '../../../src/modules/finance/application/use-cases/close-cash-session'
import {
  InMemoryCashRegisterRepository,
  FakeSaleRepository,
} from '../../helpers/fake-repositories'
import { InMemoryCashRegisterRepositoryAdapter } from '../../../src/modules/finance/infra/repositories/in-memory/in-memory-cash-register-repository'
import { SaleStatus, TransactionType } from '@prisma/client'
import { defaultSale, defaultUser } from '../../helpers/default-values'
import { CompleteCashSession } from '../../../src/repositories/cash-register-repository'
import { CashRegisterHasPendingSalesError } from '../../../src/services/@errors/cash-register/cash-register-has-pending-sales-error'
import { TransactionRunner } from '../../../src/core/application/ports/transaction-runner'
import { CashRegisterNotOpenedError } from '../../../src/modules/finance/application/errors/cash-register-not-opened-error'

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
        saleItemId: null,
        appointmentServiceId: null,
        loanId: null,
      } as any,
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
        saleItemId: null,
        appointmentServiceId: null,
        loanId: null,
      },
    ],
  }
}

describe('Close session use case', () => {
  let adapter: InMemoryCashRegisterRepositoryAdapter
  let saleRepo: FakeSaleRepository
  let useCase: CloseCashSessionUseCase
  let legacyRepo: InMemoryCashRegisterRepository

  beforeEach(() => {
    legacyRepo = new InMemoryCashRegisterRepository()
    adapter = new InMemoryCashRegisterRepositoryAdapter(legacyRepo)
    saleRepo = new FakeSaleRepository()
    const runner: TransactionRunner = {
      run: async (fn) => fn(undefined as never),
    }
    useCase = new CloseCashSessionUseCase(adapter, saleRepo, runner)
  })

  it('closes an open session', async () => {
    const session = makeSession()
    session.finalAmount = 60 // Pre-set the final amount as it's now a running total
    legacyRepo.sessions.push(session)

    const res = await useCase.execute({ unitId: 'unit-1' })

    // The service should now just close the session, not calculate the amount.
    // We expect the finalAmount to be the one that was already in the session.
    expect(res.session.finalAmount).toBe(60)
    expect(legacyRepo.sessions[0].closedAt).toBeInstanceOf(Date)
  })

  it('throws when there is no open session', async () => {
    await expect(useCase.execute({ unitId: 'unit-1' })).rejects.toThrow(
      CashRegisterNotOpenedError,
    )
  })

  it('throws when there are pending sales in the session period', async () => {
    const session = makeSession()
    session.openedAt = new Date('2024-01-01T10:00:00.000Z')
    session.finalAmount = 60
    legacyRepo.sessions.push(session)

    const pendingSale = {
      ...defaultSale,
      user: { ...defaultSale.user },
      client: { ...defaultSale.client },
      unit: { ...defaultSale.unit },
      items: defaultSale.items.map((item) => ({
        ...item,
        discounts: item.discounts.map((discount) => ({ ...discount })),
        appointment: item.appointment ? { ...item.appointment } : null,
        barber: item.barber ? { ...item.barber } : null,
        service: item.service ? { ...item.service } : null,
        product: item.product ? { ...item.product } : null,
        plan: item.plan ? { ...item.plan } : null,
      })),
      transactions: [...defaultSale.transactions],
    } as typeof defaultSale
    pendingSale.id = 'sale-pending'
    pendingSale.unitId = session.unitId
    pendingSale.sessionId = session.id
    pendingSale.status = SaleStatus.IN_PROGRESS
    pendingSale.createdAt = new Date('2024-01-01T11:00:00.000Z')

    saleRepo.sales.push(pendingSale)

    await expect(
      useCase.execute({ unitId: session.unitId }),
    ).rejects.toBeInstanceOf(CashRegisterHasPendingSalesError)
  })
})
