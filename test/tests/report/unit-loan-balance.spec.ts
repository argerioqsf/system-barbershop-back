import { describe, it, expect, beforeEach } from 'vitest'
import { UnitLoanBalanceService } from '../../../src/services/report/unit-loan-balance'
import { FakeTransactionRepository } from '../../helpers/fake-repositories'
import { makeTransaction } from '../../helpers/default-values'

describe('Unit loan balance service', () => {
  let txRepo: FakeTransactionRepository
  let service: UnitLoanBalanceService

  beforeEach(() => {
    txRepo = new FakeTransactionRepository()
    service = new UnitLoanBalanceService(txRepo)

    txRepo.transactions.push(
      makeTransaction({ unitId: 'unit-1', amount: -30, isLoan: true }),
      makeTransaction({ unitId: 'unit-1', amount: 20, isLoan: true }),
      makeTransaction({ unitId: 'unit-1', amount: 15 }),
    )
  })

  it('calculates borrowed and paid totals', async () => {
    const res = await service.execute({ unitId: 'unit-1' })
    expect(res.borrowed).toBe(30)
    expect(res.paid).toBe(20)
  })
})
