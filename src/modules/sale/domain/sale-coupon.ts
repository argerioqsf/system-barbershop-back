import { DiscountType } from '@prisma/client'
import { InvalidSaleItemError } from './errors/invalid-sale-item-error'

export interface SaleCouponProps {
  id: string
  discount: number
  discountType: DiscountType
}

export class SaleCoupon {
  private constructor(private readonly props: SaleCouponProps) {
    this.validate()
  }

  static create(props: SaleCouponProps): SaleCoupon {
    return new SaleCoupon(props)
  }

  get id(): string {
    return this.props.id
  }

  get discount(): number {
    return this.props.discount
  }

  get discountType(): DiscountType {
    return this.props.discountType
  }

  private validate(): void {
    if (!this.props.id) {
      throw new InvalidSaleItemError('Sale coupon must have a valid identifier')
    }

    if (this.props.discount < 0) {
      throw new InvalidSaleItemError(
        'Sale coupon discount must be non-negative',
      )
    }
  }
}
