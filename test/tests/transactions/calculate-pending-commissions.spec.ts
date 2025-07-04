import { describe, it, expect } from 'vitest'
import { calculateCommissions } from '../../../src/services/users/utils/calculatePendingCommissions'
import type { DetailedSaleItemFindMany } from '../../../src/repositories/sale-item-repository'
import type { Service, Sale } from '@prisma/client'

function makeSale(id: string): Sale {
  return { id, unitId: 'unit-1', createdAt: new Date(), userId: 'u1', clientId: 'c1', sessionId: null, couponId: null, total: 0, method: 'CASH', paymentStatus: 'PAID', observation: null }
}

function makeService(id: string, price: number): Service {
  return { id, name: '', description: null, imageUrl: null, cost: 0, price, category: null, defaultTime: null, commissionPercentage: null, unitId: 'unit-1' }
}

function baseItem(id: string, sale: Sale): DetailedSaleItemFindMany {
  return {
    id,
    saleId: sale.id,
    serviceId: 'svc',
    productId: null,
    quantity: 1,
    barberId: 'b1',
    couponId: null,
    price: 100,
    discount: null,
    discountType: null,
    porcentagemBarbeiro: 50,
    appointmentId: null,
    commissionPaid: false,
    sale,
    service: null as any,
    product: null as any,
    barber: null as any,
    coupon: null as any,
    appointment: null,
    transactions: [],
  }
}

describe('calculatePendingCommissions util', () => {
  it('calculates commissions for sale items', () => {
    const sale = makeSale('s1')
    const item = baseItem('it1', sale)
    item.transactions = [{ amount: 10 }]

    const res = calculateCommissions([item])

    expect(res.totalCommission).toBe(40)
    expect(res.saleItemsRecords).toHaveLength(1)
    expect(res.saleItemsRecords[0].saleItemId).toBe('it1')
    expect(res.saleItemsRecords[0].amount).toBe(40)
  })

  it('includes appointment services', () => {
    const sale = makeSale('s2')
    const item = baseItem('it2', sale)
    item.price = 80
    item.porcentagemBarbeiro = null
    item.appointmentId = 'appt1'
    const svc = makeService('svc1', 80)
    item.appointment = {
      id: 'appt1',
      clientId: 'c1',
      barberId: 'b1',
      unitId: 'unit-1',
      date: new Date('2024-01-01'),
      status: 'SCHEDULED',
      durationService: null,
      observation: null,
      services: [
        {
          id: 'aps1',
          appointmentId: 'appt1',
          serviceId: 'svc1',
          commissionPercentage: 25,
          commissionPaid: false,
          service: svc,
          transactions: [{ amount: 5 }],
        },
      ],
    }

    const res = calculateCommissions([item])

    expect(res.totalCommission).toBe(15)
    expect(res.saleItemsRecords).toHaveLength(1)
    expect(res.saleItemsRecords[0].appointmentServiceId).toBe('aps1')
  })

  it('ignores fully paid items', () => {
    const sale = makeSale('s3')
    const item = baseItem('it3', sale)
    item.transactions = [{ amount: 50 }]

    const res = calculateCommissions([item])

    expect(res.totalCommission).toBe(0)
    expect(res.saleItemsRecords).toHaveLength(0)
  })
})
