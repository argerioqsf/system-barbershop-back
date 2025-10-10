export function round(value: number): number {
  return Number(Math.round(Number(value + 'e2')) + 'e-2')
}

export function toCents(value: number): number {
  return Math.round(value * 100)
}

export function fromCents(value: number): number {
  return value / 100
}
