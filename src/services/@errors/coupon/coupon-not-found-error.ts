export class CouponNotFoundError extends Error {
  constructor() {
    super('Coupon not found')
  }
}
