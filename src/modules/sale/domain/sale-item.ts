import { InvalidSaleItemError } from './errors/invalid-sale-item-error'

export interface SaleItemProps {
  quantity?: number
  customPrice?: number | null
}

export class SaleItem {
  private constructor(private readonly props: SaleItemProps) {
    this.validate()
  }

  static create(props: SaleItemProps): SaleItem {
    return new SaleItem(props)
  }

  get quantity(): number | undefined {
    return this.props.quantity
  }

  get customPrice(): number | null | undefined {
    return this.props.customPrice
  }

  private validate(): void {
    const { quantity, customPrice } = this.props

    if (quantity !== undefined && quantity <= 0) {
      throw new InvalidSaleItemError(
        'Sale item quantity must be greater than zero',
      )
    }

    if (customPrice !== undefined && customPrice !== null && customPrice < 0) {
      throw new InvalidSaleItemError(
        'Sale item custom price must be greater than or equal to zero',
      )
    }
  }
}
