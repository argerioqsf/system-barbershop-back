import { describe, expect, it } from 'vitest'
import { Debt } from '../../../../src/modules/finance/domain/entities/debt'
import { Money } from '../../../../src/core/domain/value-objects/money'
import { DebtStatus } from '../../../../src/modules/finance/domain/types/status'

const baseProps = {
  planId: 'plan-1',
  planProfileId: 'plan-profile-1',
  amount: Money.from(120),
  dueDate: new Date('2024-01-01'),
}

describe('Debt entity', () => {
  it('creates debt as pending by default', () => {
    const debt = Debt.create(baseProps)

    expect(debt.status).toBe(DebtStatus.PENDING)
    expect(debt.paymentDate).toBeNull()
  })

  it('requires payment date for paid debts', () => {
    expect(() =>
      Debt.create({ ...baseProps, status: DebtStatus.PAID }),
    ).toThrow()
  })

  it('rejects payment date when pending', () => {
    expect(() =>
      Debt.create({ ...baseProps, paymentDate: new Date() }),
    ).toThrow()
  })

  it('marks debt as paid and records payment date', () => {
    const debt = Debt.create(baseProps)
    const paid = debt.markAsPaid()

    expect(paid.status).toBe(DebtStatus.PAID)
    expect(paid.paymentDate).not.toBeNull()
  })

  it('returns to pending clearing payment date', () => {
    const debt = Debt.create(baseProps).markAsPaid()
    const pending = debt.markAsPending()

    expect(pending.status).toBe(DebtStatus.PENDING)
    expect(pending.paymentDate).toBeNull()
  })
})
