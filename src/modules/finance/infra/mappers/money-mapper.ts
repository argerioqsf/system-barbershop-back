import { Money } from '@/core/domain/value-objects/money'

export class MoneyMapper {
  static toMoney(value: number | null | undefined): Money {
    return Money.from(value ?? 0)
  }

  static toNumber(money: Money): number {
    return money.toNumber()
  }
}
