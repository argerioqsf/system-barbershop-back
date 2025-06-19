export class CouponExhaustedError extends Error {
  constructor() {
    super('Coupon exhausted')
  }
}
