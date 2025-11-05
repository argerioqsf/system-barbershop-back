import { describe, expect, it } from 'vitest'
import { Loan } from '../../../../src/modules/finance/domain/entities/loan'
import { Money } from '../../../../src/core/domain/value-objects/money'
import { LoanStatus } from '../../../../src/modules/finance/domain/types/status'

const baseProps = {
  unitId: 'unit-1',
  userId: 'user-1',
  sessionId: 'session-1',
  amount: Money.from(100),
}

describe('Loan entity', () => {
  it('creates loan as pending by default', () => {
    const loan = Loan.create(baseProps)

    expect(loan.status).toBe(LoanStatus.PENDING)
    expect(loan.paidAt).toBeNull()
  })

  it('requires paidAt when marking paid off', () => {
    expect(() =>
      Loan.create({
        ...baseProps,
        status: LoanStatus.PAID_OFF,
      }),
    ).toThrow()
  })

  it('rejects paidAt when status is not paid off', () => {
    expect(() =>
      Loan.create({
        ...baseProps,
        paidAt: new Date(),
      }),
    ).toThrow()
  })

  it('marks loan as value transferred', () => {
    const loan = Loan.create(baseProps)

    const transferred = loan.markAsValueTransferred('admin-1')

    expect(transferred.status).toBe(LoanStatus.VALUE_TRANSFERRED)
    expect(transferred.updatedById).toBe('admin-1')
    expect(transferred.paidAt).toBeNull()
  })

  it('marks loan as paid off and stores paid date', () => {
    const loan = Loan.create({
      ...baseProps,
      status: LoanStatus.VALUE_TRANSFERRED,
    })

    const paidOff = loan.markAsPaidOff('admin-2')

    expect(paidOff.status).toBe(LoanStatus.PAID_OFF)
    expect(paidOff.updatedById).toBe('admin-2')
    expect(paidOff.paidAt).not.toBeNull()
  })

  it('requires positive amount', () => {
    expect(() => Loan.create({ ...baseProps, amount: Money.from(0) })).toThrow()
    expect(() =>
      Loan.create({ ...baseProps, amount: Money.from(-10) }),
    ).toThrow()
  })
})
