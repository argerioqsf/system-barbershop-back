import { describe, it, expect, beforeEach } from 'vitest'
import { ListUserSoldProductsService } from '../../../src/services/users/list-user-sold-products'
import { FakeSaleRepository } from '../../helpers/fake-repositories'
import {
  makeSale,
  barberUser,
  barberProfile,
  makeProduct,
  defaultSale,
} from '../../helpers/default-values'

describe('List user sold products service', () => {
  let repo: FakeSaleRepository
  let service: ListUserSoldProductsService

  beforeEach(() => {
    repo = new FakeSaleRepository()
    service = new ListUserSoldProductsService(repo)
  })

  it('returns product items sold by the barber', async () => {
    const product = makeProduct('prod-1', 50)
    const sale1 = makeSale('s1')
    sale1.items.push({
      ...defaultSale,
      id: 'i1',
      saleId: sale1.id,
      serviceId: null,
      productId: product.id,
      quantity: 1,
      barberId: barberUser.id,
      couponId: null,
      price: 50,
      discount: null,
      discountType: null,
      porcentagemBarbeiro: null,
      service: null,
      product,
      barber: { ...barberUser, profile: barberProfile },
      coupon: null,
      appointmentId: null,
      appointment: null,
    })
    const sale2 = makeSale('s2')
    sale2.items.push({
      id: 'i2',
      saleId: sale2.id,
      serviceId: null,
      productId: 'other',
      quantity: 1,
      barberId: 'other-barber',
      couponId: null,
      price: 30,
      discount: null,
      discountType: null,
      porcentagemBarbeiro: null,
      service: null,
      product: makeProduct('other', 30),
      barber: { ...barberUser, id: 'other-barber', profile: barberProfile },
      coupon: null,
      appointmentId: null,
      appointment: null,
    })
    const sale3 = makeSale('s3')
    sale3.items.push({
      id: 'i2',
      saleId: sale3.id,
      serviceId: null,
      productId: 'other',
      quantity: 1,
      barberId: 'other-barber',
      couponId: null,
      price: 30,
      discount: null,
      discountType: null,
      porcentagemBarbeiro: null,
      service: null,
      product: makeProduct('other', 30),
      barber: { ...barberUser, id: 'other-barber', profile: barberProfile },
      coupon: null,
      appointmentId: null,
      appointment: null,
    })
    repo.sales.push(sale1, sale2, sale3)

    const res = await service.execute({ userId: barberUser.id })
    // TODO: verificar logica do teste
    expect(res.items).toHaveLength(1)
    expect(res.items[0].productId).toBe(product.id)
  })
})
