import { describe, it, expect } from 'vitest'
import {
  timeToMinutes,
  intervalsOverlap,
  mergeIntervals,
  subtractIntervals,
  minutesToTime,
} from '../../../src/utils/time'

describe('time utilities', () => {
  it('converts time to minutes', () => {
    expect(timeToMinutes('00:00')).toBe(0)
    expect(timeToMinutes(new Date('2024-01-01T01:30:00Z'))).toBe(90)
  })

  it('detects interval overlap', () => {
    expect(intervalsOverlap(0, 10, 5, 15)).toBe(true)
    expect(intervalsOverlap(0, 10, 10, 20)).toBe(false)
    expect(intervalsOverlap(0, 5, 6, 8)).toBe(false)
  })

  it('merges overlapping intervals', () => {
    const merged = mergeIntervals([
      { start: 0, end: 10 },
      { start: 5, end: 15 },
      { start: 20, end: 25 },
    ])
    expect(merged).toEqual([
      { start: 0, end: 15 },
      { start: 20, end: 25 },
    ])
  })

  it('merges contiguous intervals', () => {
    const merged = mergeIntervals([
      { start: 0, end: 10 },
      { start: 10, end: 20 },
    ])
    expect(merged).toEqual([{ start: 0, end: 20 }])
  })

  it('subtracts intervals correctly', () => {
    const split = subtractIntervals(
      [{ start: 0, end: 60 }],
      [{ start: 20, end: 40 }],
    )
    expect(split).toEqual([
      { start: 0, end: 20 },
      { start: 40, end: 60 },
    ])

    const startCut = subtractIntervals(
      [{ start: 0, end: 60 }],
      [{ start: 0, end: 10 }],
    )
    expect(startCut).toEqual([{ start: 10, end: 60 }])

    const none = subtractIntervals(
      [{ start: 0, end: 60 }],
      [{ start: -10, end: 70 }],
    )
    expect(none).toEqual([])
  })

  it('converts minutes to time string', () => {
    expect(minutesToTime(0)).toBe('00:00')
    expect(minutesToTime(125)).toBe('02:05')
  })
})
