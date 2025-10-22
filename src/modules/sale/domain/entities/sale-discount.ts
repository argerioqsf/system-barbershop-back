import { DiscountOrigin, DiscountType } from '@prisma/client'
import { InvalidSaleItemError } from '../errors/invalid-sale-item-error'

export interface SaleDiscountProps {
  amount: number
  type: DiscountType
  origin: DiscountOrigin
  order: number
}

export class SaleDiscount {
  private constructor(private readonly props: SaleDiscountProps) {
    this.validate()
  }

  static create(props: SaleDiscountProps): SaleDiscount {
    return new SaleDiscount(props)
  }

  get amount(): number {
    return this.props.amount
  }

  get type(): DiscountType {
    return this.props.type
  }

  get origin(): DiscountOrigin {
    return this.props.origin
  }

  get order(): number {
    return this.props.order
  }

  toPrimitives(): SaleDiscountProps {
    return { ...this.props }
  }

  private validate(): void {
    if (this.props.amount < 0) {
      throw new InvalidSaleItemError(
        'Sale discount amount must be non-negative',
      )
    }

    if (this.props.order <= 0) {
      throw new InvalidSaleItemError(
        'Sale discount order must be greater than zero',
      )
    }
  }
}
