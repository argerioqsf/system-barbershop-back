import { describe, expect, it } from 'vitest'
import { CashSession } from '../../../../src/modules/finance/domain/entities/cash-session'
import { Money } from '../../../../src/core/domain/value-objects/money'

describe('CashSession', () => {
  it('opens session with initial and final amount equal', () => {
    const session = CashSession.open({
      unitId: 'unit-1',
      openedByUserId: 'user-1',
      openingAmount: Money.from(100),
    })

    expect(session.isOpen).toBe(true)
    expect(session.openingAmount.toNumber()).toBe(100)
    expect(session.finalAmount.toNumber()).toBe(100)
    expect(session.closedAt).toBeNull()
  })

  it('updates final amount while session is open', () => {
    const session = CashSession.open({
      unitId: 'unit-1',
      openedByUserId: 'user-1',
      openingAmount: Money.from(50),
    })

    const updated = session.updateFinalAmount(Money.from(75))

    expect(updated.finalAmount.toNumber()).toBe(75)
    expect(updated.isOpen).toBe(true)
  })

  it('closes session and prevents reopening', () => {
    const session = CashSession.open({
      unitId: 'unit-1',
      openedByUserId: 'user-1',
      openingAmount: Money.from(30),
    })

    const closed = session.close(Money.from(45))
    expect(closed.isOpen).toBe(false)
    expect(closed.finalAmount.toNumber()).toBe(45)
    expect(closed.closedAt).not.toBeNull()

    const closedAgain = closed.close(Money.from(60))
    expect(closedAgain.finalAmount.toNumber()).toBe(45)
  })

  it('rejects negative opening amount', () => {
    expect(() =>
      CashSession.open({
        unitId: 'unit-1',
        openedByUserId: 'user-1',
        openingAmount: Money.from(-10),
      }),
    ).toThrow('Opening amount cannot be negative')
  })
})
