import { SaleItem } from './sale-item'

export interface SaleProps {
  id: string
  items: SaleItem[]
  couponId?: string | null
}

export class Sale {
  private constructor(private readonly props: SaleProps) {}

  static create(props: SaleProps): Sale {
    return new Sale({
      ...props,
      couponId: props.couponId ?? null,
    })
  }

  get id(): string {
    return this.props.id
  }

  get items(): SaleItem[] {
    return this.props.items
  }

  get couponId(): string | null {
    return this.props.couponId ?? null
  }

  get total(): number {
    return this.props.items.reduce((sum, item) => sum + item.netTotal, 0)
  }

  get grossTotal(): number {
    return this.props.items.reduce((sum, item) => sum + item.grossTotal, 0)
  }

  withItems(items: SaleItem[]): Sale {
    return Sale.create({
      id: this.id,
      items,
      couponId: this.couponId,
    })
  }

  withCoupon(couponId: string | null): Sale {
    return Sale.create({
      id: this.id,
      items: this.items,
      couponId,
    })
  }
}
