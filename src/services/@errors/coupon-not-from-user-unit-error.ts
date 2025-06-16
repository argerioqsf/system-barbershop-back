export class CouponNotFromUserUnitError extends Error {
  constructor() {
    super('Coupon does not belong to your unit')
  }
}
