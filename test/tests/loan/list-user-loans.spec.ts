import { describe, it, expect, beforeEach } from 'vitest'
import { ListUserLoansService } from '../../../src/services/loan/list-user-loans'
import { FakeLoanRepository } from '../../helpers/fake-repositories'
import { LoanStatus } from '@prisma/client'

let loanRepo: FakeLoanRepository
let service: ListUserLoansService

function makeLoan(id: string, amount: number, paid: number) {
  return {
    id,
    userId: 'u1',
    unitId: 'unit-1',
    sessionId: 's1',
    amount,
    status: LoanStatus.PAID,
    createdAt: new Date('2024-01-01'),
    paidAt: null,
    fullyPaid: false,
    updatedById: null,
    transactions: paid > 0 ? [{ amount: paid } as any] : [],
  }
}

beforeEach(() => {
  loanRepo = new FakeLoanRepository()
  service = new ListUserLoansService(loanRepo)
})

describe('List user loans service', () => {
  it('separates pending and paid loans and totals owed amount', async () => {
    loanRepo.loans.push(makeLoan('l1', 100, 40))
    loanRepo.loans.push(makeLoan('l2', 50, 50))
    loanRepo.loans.push(makeLoan('l3', 30, 0))

    const res = await service.execute({ userId: 'u1' })

    expect(res.pending).toHaveLength(2)
    expect(res.paid).toHaveLength(1)
    expect(res.totalOwed).toBe(90)
    const idsPending = res.pending.map((l) => l.id)
    expect(idsPending).toContain('l1')
    expect(idsPending).toContain('l3')
  })
})
