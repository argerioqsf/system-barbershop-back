import { describe, it, expect } from 'vitest'
import {
  ProfitDistributionService,
  SaleForDistribution,
} from './profit-distribution'

describe('ProfitDistributionService', () => {
  const service = new ProfitDistributionService()

  it('should distribute profits correctly for a simple product sale', () => {
    const sale: Partial<SaleForDistribution> = {
      items: [
        {
          id: 'item1',
          price: 100,
          discounts: [],
          barberId: 'barber1',
          productId: 'prod1',
          barber: {
            id: 'barber1',
            profile: {
              commissionPercentage: 20, // 20%
            },
          },
          product: {
            commissionPercentage: null, // Use profile commission
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      ],
    }

    const result = service.execute(sale as SaleForDistribution)

    expect(result.ownerShare.toNumber()).toBe(80)
    expect(result.barberShares.length).toBe(1)
    expect(result.barberShares[0].barberId).toBe('barber1')
    expect(result.barberShares[0].amount.toNumber()).toBe(20)
    expect(result.barberShares[0].commissionPercentage.toNumber()).toBe(20)
  })

  it('should give all profit to owner if no barber is assigned', () => {
    const sale: Partial<SaleForDistribution> = {
      items: [
        {
          id: 'item1',
          price: 100,
          discounts: [],
          barberId: null,
          productId: 'prod1',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      ],
    }

    const result = service.execute(sale as SaleForDistribution)

    expect(result.ownerShare.toNumber()).toBe(100)
    expect(result.barberShares.length).toBe(0)
  })

  it('should handle sales with value discounts', () => {
    const sale: Partial<SaleForDistribution> = {
      items: [
        {
          id: 'item1',
          price: 100,
          discounts: [{ type: 'VALUE', amount: 10, order: 1 }],
          barberId: 'barber1',
          productId: 'prod1',
          barber: {
            id: 'barber1',
            profile: {
              commissionPercentage: 20, // 20%
            },
          },
          product: {
            commissionPercentage: null,
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      ],
    }

    const result = service.execute(sale as SaleForDistribution)

    // Net price is 90. Barber gets 20% of 90 = 18. Owner gets 90 - 18 = 72.
    expect(result.ownerShare.toNumber()).toBe(72)
    expect(result.barberShares[0].amount.toNumber()).toBe(18)
  })

  it('should handle sales with percentage discounts', () => {
    const sale: Partial<SaleForDistribution> = {
      items: [
        {
          id: 'item1',
          price: 100,
          discounts: [{ type: 'PERCENTAGE', amount: 10, order: 1 }], // 10% discount
          barberId: 'barber1',
          productId: 'prod1',
          barber: {
            id: 'barber1',
            profile: {
              commissionPercentage: 20, // 20%
            },
          },
          product: {
            commissionPercentage: null,
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      ],
    }

    const result = service.execute(sale as SaleForDistribution)

    // Net price is 90. Barber gets 20% of 90 = 18. Owner gets 90 - 18 = 72.
    expect(result.ownerShare.toNumber()).toBe(72)
    expect(result.barberShares[0].amount.toNumber()).toBe(18)
  })

  it('should give all profit to owner for plan sales', () => {
    const sale: Partial<SaleForDistribution> = {
      items: [
        {
          id: 'item1',
          price: 50,
          discounts: [],
          barberId: 'barber1', // Even with a barber
          planId: 'plan1', // It's a plan
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      ],
    }

    const result = service.execute(sale as SaleForDistribution)

    expect(result.ownerShare.toNumber()).toBe(50)
    expect(result.barberShares.length).toBe(0)
  })

  it('should use relation commission when available', () => {
    const sale: Partial<SaleForDistribution> = {
      items: [
        {
          id: 'item1',
          price: 100,
          discounts: [],
          barberId: 'barber1',
          productId: 'prod1',
          barber: {
            id: 'barber1',
            profile: {
              commissionPercentage: 20, // Profile commission
            },
          },
          product: {
            commissionPercentage: null,
          },
          relation: {
            commissionPercentage: 50, // Specific relation commission
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      ],
    }

    const result = service.execute(sale as SaleForDistribution)

    // Barber gets 50% of 100 = 50. Owner gets 100 - 50 = 50.
    expect(result.ownerShare.toNumber()).toBe(50)
    expect(result.barberShares[0].amount.toNumber()).toBe(50)
    expect(result.barberShares[0].commissionPercentage.toNumber()).toBe(50)
  })
})
