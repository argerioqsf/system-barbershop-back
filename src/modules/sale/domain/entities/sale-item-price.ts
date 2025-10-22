import { InvalidSaleItemError } from '../errors/invalid-sale-item-error'
import { SaleDiscount, SaleDiscountProps } from './sale-discount'
import { Money } from '../value-objects/money'
import { Percentage } from '../value-objects/percentage'

export interface SaleItemPriceProps {
  basePrice: number
  quantity: number
  customPrice?: number | null
  discounts?: SaleDiscountProps[]
}

export class SaleItemPrice {
  private readonly basePriceValue: Money
  private readonly quantityValue: number
  private readonly customUnitPrice: Money | null
  private readonly discounts: SaleDiscount[]

  private constructor(private readonly props: SaleItemPriceProps) {
    this.validate()
    this.basePriceValue = Money.from(props.basePrice)
    this.quantityValue = props.quantity
    this.customUnitPrice =
      props.customPrice === undefined || props.customPrice === null
        ? null
        : Money.from(props.customPrice)
    this.discounts = (props.discounts ?? []).map(SaleDiscount.create)
  }

  static create(props: SaleItemPriceProps): SaleItemPrice {
    return new SaleItemPrice(props)
  }

  get basePrice(): number {
    return this.basePriceValue.toNumber()
  }

  get quantity(): number {
    return this.quantityValue
  }

  get customPrice(): number | null {
    return this.customUnitPrice?.toNumber() ?? null
  }

  get effectiveUnitPrice(): number {
    return this.resolveUnitPrice().toNumber()
  }

  get grossTotal(): number {
    return this.basePriceValue.toNumber()
  }

  get netTotal(): number {
    return this.calculateNetTotalMoney().toNumber()
  }

  get discountTotal(): number {
    const discountValue = this.basePriceValue
      .subtract(this.calculateNetTotalMoney())
      .clampZero()

    return discountValue.toNumber()
  }

  get appliedDiscounts(): SaleDiscountProps[] {
    return this.discounts.map((discount) => discount.toPrimitives())
  }

  private resolveUnitPrice(): Money {
    if (this.customUnitPrice) {
      return this.customUnitPrice
    }

    return this.basePriceValue.divide(this.quantityValue)
  }

  private calculateNetTotalMoney(): Money {
    const totalBeforeDiscount = this.customUnitPrice
      ? this.customUnitPrice.multiply(this.quantityValue)
      : this.basePriceValue
    return this.applyDiscounts(totalBeforeDiscount)
  }

  private applyDiscounts(amount: Money): Money {
    return this.discounts
      .reduce((current, discount) => {
        if (discount.type === 'VALUE') {
          return current.subtract(Money.from(discount.amount))
        }

        if (discount.type === 'PERCENTAGE') {
          const percentage = Percentage.from(discount.amount)
          const reduction = current.percentage(percentage)
          return current.subtract(reduction)
        }

        return current
      }, amount)
      .clampZero()
  }

  private validate(): void {
    const { basePrice, quantity, customPrice } = this.props
    if (quantity <= 0) {
      throw new InvalidSaleItemError(
        'Sale item quantity must be greater than zero',
      )
    }

    if (basePrice < 0) {
      throw new InvalidSaleItemError('Sale item base price must be positive')
    }

    if (customPrice !== undefined && customPrice !== null && customPrice < 0) {
      throw new InvalidSaleItemError(
        'Sale item custom price must be greater than or equal to zero',
      )
    }
  }
}
