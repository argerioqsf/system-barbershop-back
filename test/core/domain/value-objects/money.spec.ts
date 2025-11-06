import { describe, expect, it } from 'vitest'
import { Money } from '../../../../src/core/domain/value-objects/money'
import { Percentage } from '../../../../src/core/domain/value-objects/percentage'

describe('Money', () => {
  it('creates money from number with rounding to cents', () => {
    const value = Money.from(10.123)

    expect(value.toNumber()).toBe(10.12)
  })

  it('adds and subtracts values preserving cents', () => {
    const a = Money.from(10.1)
    const b = Money.from(5.25)

    expect(a.add(b).toNumber()).toBe(15.35)
    expect(a.subtract(b).toNumber()).toBe(4.85)
  })

  it('multiplies and divides values with deterministic rounding', () => {
    const value = Money.from(10.2)

    expect(value.multiply(1.5).toNumber()).toBe(15.3)
    expect(value.divide(3).toNumber()).toBe(3.4)
  })

  it('applies percentage returning new money instance', () => {
    const amount = Money.from(200)
    const percentage = Percentage.from(12.5)

    const result = amount.percentage(percentage)

    expect(result.toNumber()).toBe(25)
  })

  it('clamps negative values to zero', () => {
    const result = Money.from(-10).clampZero()

    expect(result.toNumber()).toBe(0)
  })

  it('negates and compares absolute values', () => {
    const value = Money.from(42.5)

    expect(value.negate().toNumber()).toBe(-42.5)
    expect(value.negate().abs().toNumber()).toBe(42.5)
  })

  it('compares values without floating point precision issues', () => {
    const a = Money.from(10.5)
    const b = Money.from(10.5)
    const c = Money.from(8.1)

    expect(a.equals(b)).toBe(true)
    expect(a.greaterThan(c)).toBe(true)
    expect(c.lessThan(a)).toBe(true)
  })
})
