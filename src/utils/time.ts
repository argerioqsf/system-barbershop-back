export function timeToMinutes(time: string | Date): number {
  if (time instanceof Date) {
    return time.getHours() * 60 + time.getMinutes()
  }
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function intervalsOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd
}

export function mergeIntervals(
  intervals: { start: number; end: number }[],
): { start: number; end: number }[] {
  const sorted = intervals.sort((a, b) => a.start - b.start)
  const merged: { start: number; end: number }[] = []
  for (const int of sorted) {
    const last = merged[merged.length - 1]
    if (!last || int.start > last.end) {
      merged.push({ ...int })
    } else if (int.end > last.end) {
      last.end = int.end
    }
  }
  return merged
}
