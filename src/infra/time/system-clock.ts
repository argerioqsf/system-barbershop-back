import { Clock } from '@/core/application/ports/clock'

export class SystemClock implements Clock {
  now(): Date {
    return new Date()
  }
}

export const systemClock = new SystemClock()
