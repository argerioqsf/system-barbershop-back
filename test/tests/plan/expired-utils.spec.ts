import { describe, it, expect } from 'vitest'
import {
  isPlanExpired,
  isPlanExpiredOfTheLimit,
} from '../../../src/services/plan/utils/expired'

// Helper to build a Debt-like object with minimum required fields
function makeDebt(over: Partial<import('@prisma/client').Debt> = {}) {
  const base: import('@prisma/client').Debt = {
    id: 'd1',
    value: 100,
    status: 'PAID',
    planId: 'plan1',
    planProfileId: 'pp1',
    paymentDate: new Date('2024-06-01T00:00:00Z'),
    dueDate: new Date('2024-07-01T00:00:00Z'),
    createdAt: new Date('2024-06-01T00:00:00Z'),
  } as unknown as import('@prisma/client').Debt
  return { ...base, ...over }
}

describe('expired utils', () => {
  describe('isPlanExpired', () => {
    it('returns true when today is after dueDate (ignores time)', () => {
      const debt = makeDebt({ dueDate: new Date('2024-07-01T15:30:00Z') })
      const today = new Date('2024-07-02T00:00:00Z')
      expect(isPlanExpired(debt, today)).toBe(true)
    })

    it('returns false when today equals dueDate (same day)', () => {
      const debt = makeDebt({ dueDate: new Date('2024-07-01T10:00:00Z') })
      const today = new Date('2024-07-01T23:59:59Z')
      expect(isPlanExpired(debt, today)).toBe(false)
    })

    it('returns false when today is before dueDate', () => {
      const debt = makeDebt({ dueDate: new Date('2024-07-01T00:00:00Z') })
      const today = new Date('2024-06-30T23:00:00Z')
      expect(isPlanExpired(debt, today)).toBe(false)
    })
  })

  describe('isPlanExpiredOfTheLimit', () => {
    it('returns true when today is after dueDate + (planTime + 1) months', () => {
      // dueDate: 2024-06-01, planTime: 1 → limite: 2024-08-01
      const debt = makeDebt({ dueDate: new Date('2024-06-01T00:00:00Z') })
      const today = new Date('2024-08-02T00:00:00Z')
      expect(isPlanExpiredOfTheLimit(debt, 1, today)).toBe(true)
    })

    it('returns false when today equals dueDate + (planTime + 1) months', () => {
      const debt = makeDebt({ dueDate: new Date('2024-06-01T00:00:00Z') })
      const today = new Date('2024-08-01T00:00:00Z')
      expect(isPlanExpiredOfTheLimit(debt, 1, today)).toBe(false)
    })

    it('returns false when today is before dueDate + (planTime + 1) months', () => {
      const debt = makeDebt({ dueDate: new Date('2024-06-01T00:00:00Z') })
      const today = new Date('2024-07-31T23:59:00Z')
      expect(isPlanExpiredOfTheLimit(debt, 1, today)).toBe(false)
    })
  })
})
