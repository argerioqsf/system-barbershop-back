import { describe, expect, it } from 'vitest'
import { Percentage } from '../../../../src/core/domain/value-objects/percentage'

describe('Percentage', () => {
  it('validates non negative finite values', () => {
    expect(() => Percentage.from(10)).not.toThrow()
    expect(() => Percentage.from(-1)).toThrow()
    expect(() => Percentage.from(Number.NaN)).toThrow()
  })

  it('adds and subtracts percentages', () => {
    const ten = Percentage.from(10)
    const five = Percentage.from(5)

    expect(ten.add(five).toNumber()).toBe(15)
    expect(ten.subtract(five).toNumber()).toBe(5)
  })

  it('throws when subtraction results in negative', () => {
    const ten = Percentage.from(10)
    const fifteen = Percentage.from(15)

    expect(() => ten.subtract(fifteen)).toThrow()
  })

  it('converts to decimal fraction', () => {
    const percentage = Percentage.from(12.5)

    expect(percentage.toDecimal()).toBe(0.125)
  })
})
