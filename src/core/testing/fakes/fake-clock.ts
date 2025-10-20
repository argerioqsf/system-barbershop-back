import { Clock } from '@/core/application/ports/clock'

export class FakeClock implements Clock {
  constructor(private current: Date = new Date()) {}

  now(): Date {
    return this.current
  }

  set(date: Date): void {
    this.current = date
  }
}
