import { FakeSaleRepository } from '../fake-repositories'
import { makeSaleWithBarber, makeBarberServiceRel, makeService } from '../default-values'

export function seedSaleWithServiceAndCoupon(repo: FakeSaleRepository) {
  const sale = makeSaleWithBarber()
  sale.id = 'sale-fx-service-coupon'
  sale.couponId = 'coupon-value'
  sale.total = 90
  sale.items[0].id = 'si-service'
  sale.items[0].serviceId = 'svc-service'
  sale.items[0].price = 90
  repo.sales.push(sale)
  return sale
}
