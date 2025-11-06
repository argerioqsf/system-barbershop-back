import { describe, expect, it } from 'vitest'
import { Transaction } from '../../../../src/modules/finance/domain/entities/transaction'
import { Money } from '../../../../src/core/domain/value-objects/money'

function makeTransaction(
  overrides: Partial<Parameters<typeof Transaction.create>[0]> = {},
) {
  return Transaction.create({
    amount: Money.from(10),
    reason: 'OTHER',
    userId: 'user-1',
    ...overrides,
  })
}

describe('Transaction', () => {
  it('creates transaction with normalized nullable fields', () => {
    const transaction = makeTransaction({
      description: '  Payment ',
      affectedUserId: ' affected ',
      saleId: undefined,
      receiptUrl: ' ',
    })

    expect(transaction.description).toBe('Payment')
    expect(transaction.affectedUserId).toBe('affected')
    expect(transaction.saleId).toBeNull()
    expect(transaction.receiptUrl).toBeNull()
  })

  it('throws when amount is zero', () => {
    expect(() => makeTransaction({ amount: Money.zero() })).toThrow()
  })

  it('throws when reason is missing', () => {
    expect(() =>
      makeTransaction({ reason: undefined as unknown as 'OTHER' }),
    ).toThrow()
  })

  it('retains monetary value without sign modifications', () => {
    const transaction = makeTransaction({ amount: Money.from(-50) })

    expect(transaction.amount.toNumber()).toBe(-50)
  })

  it('supports setting id after creation', () => {
    const transaction = makeTransaction().withId('tx-1')

    expect(transaction.id).toBe('tx-1')
  })
})
