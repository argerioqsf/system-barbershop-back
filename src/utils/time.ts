export function timeToMinutes(time: string | Date): number {
  if (time instanceof Date) {
    return time.getUTCHours() * 60 + time.getUTCMinutes()
  }
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export interface Intervals {
  start: number
  end: number
  weekDay?: number
}

export interface IntervalsFormatted {
  start: string
  end: string
  weekDay?: number
}

export function intervalsOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd
}

function splitIntervalsByMax(
  intervals: Intervals[],
  intervalMax: number,
): Intervals[] {
  const result: Intervals[] = []
  for (const int of intervals) {
    let currentStart = int.start
    while (currentStart < int.end) {
      const currentEnd = Math.min(currentStart + intervalMax, int.end)
      result.push({ start: currentStart, end: currentEnd })
      currentStart = currentEnd
    }
  }
  return result
}

export function mergeIntervals(
  intervals: Intervals[],
  intervalMax?: number,
): Intervals[] {
  const sorted = intervals.sort((a, b) => a.start - b.start)
  const merged: Intervals[] = []

  for (const int of sorted) {
    const last = merged[merged.length - 1]
    if (!last || int.start > last.end) {
      merged.push({ ...int })
    } else if (int.end > last.end) {
      last.end = int.end
    }
  }

  return intervalMax ? splitIntervalsByMax(merged, intervalMax) : merged
}

export function subtractIntervals(
  ranges: Intervals[],
  blocks: Intervals[],
): Intervals[] {
  let result = [...ranges]
  for (const b of blocks) {
    const partial: Intervals[] = []
    for (const r of result) {
      if (!intervalsOverlap(r.start, r.end, b.start, b.end)) {
        partial.push(r)
        continue
      }
      if (b.start > r.start) {
        partial.push({ start: r.start, end: Math.min(b.start, r.end) })
      }
      if (b.end < r.end) {
        partial.push({ start: Math.max(b.end, r.start), end: r.end })
      }
    }
    result = partial
    if (result.length === 0) break
  }
  return result
}

export function minutesToTime(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
