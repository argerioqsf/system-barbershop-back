import { SaleItemPrice, SaleItemPriceProps } from './sale-item-price'

export interface SaleItemProps extends SaleItemPriceProps {
  id?: string
  couponId?: string | null
}

export class SaleItem {
  private constructor(
    private readonly price: SaleItemPrice,
    private readonly idValue?: string,
    private readonly couponIdValue: string | null = null,
  ) {}

  static create(props: SaleItemProps): SaleItem {
    return new SaleItem(
      SaleItemPrice.create(props),
      props.id,
      props.couponId ?? null,
    )
  }

  get id(): string | undefined {
    return this.idValue
  }

  get couponId(): string | null {
    return this.couponIdValue
  }

  get quantity(): number {
    return this.price.quantity
  }

  get customPrice(): number | null {
    return this.price.customPrice
  }

  get basePrice(): number {
    return this.price.basePrice
  }

  get netTotal(): number {
    return this.price.netTotal
  }

  get grossTotal(): number {
    return this.price.grossTotal
  }

  get discounts(): SaleItemPriceProps['discounts'] {
    return this.price.appliedDiscounts
  }
}
