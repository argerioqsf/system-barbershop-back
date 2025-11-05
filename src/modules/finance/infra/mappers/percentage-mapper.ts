import { Percentage } from '@/core/domain/value-objects/percentage'

export class PercentageMapper {
  static toPercentage(value: number | null | undefined): Percentage {
    return Percentage.from(value ?? 0)
  }

  static toNumber(percentage: Percentage): number {
    return percentage.toNumber()
  }
}
