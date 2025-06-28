import { describe, it, expect } from 'vitest'
import { SetLoanStatusService } from '../../../src/services/loan/set-loan-status'
import { FakeLoanRequestRepository } from '../../helpers/fake-repositories'
import { LoanStatus } from '@prisma/client'


describe('Set loan status service', () => {
  it('updates status', async () => {
    const repo = new FakeLoanRequestRepository([
      { id: 'l1', userId: 'u1', unitId: 'unit-1', amount: 20, status: LoanStatus.PENDING, createdAt: new Date(), updatedAt: new Date() },
    ])
    const service = new SetLoanStatusService(repo)
    const { loan } = await service.execute({ id: 'l1', status: LoanStatus.ACCEPTED })
    expect(loan.status).toBe(LoanStatus.ACCEPTED)
  })
})
