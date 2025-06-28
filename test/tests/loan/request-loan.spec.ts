import { describe, it, expect } from 'vitest'
import { RequestLoanService } from '../../../src/services/loan/request-loan'
import { FakeLoanRequestRepository } from '../../helpers/fake-repositories'

describe('Request loan service', () => {
  it('creates loan request', async () => {
    const repo = new FakeLoanRequestRepository()
    const service = new RequestLoanService(repo)
    const { loan } = await service.execute({ userId: 'u1', unitId: 'unit-1', amount: 50 })
    expect(repo.items).toHaveLength(1)
    expect(loan.amount).toBe(50)
    expect(loan.status).toBe('PENDING')
  })
})
