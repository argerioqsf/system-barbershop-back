import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SaleTotalsService } from '../../../src/modules/sale/application/services/sale-totals-service'
import { Coupon, DiscountOrigin, DiscountType } from '@prisma/client'
import {
  DetailedSale,
  SaleRepository,
} from '../../../src/repositories/sale-repository'
import { DetailedSaleItemFindById } from '../../../src/repositories/sale-item-repository'
import {
  ReturnBuildItemData,
  SaleItemBuildItem,
} from '../../../src/services/sale/utils/item'
import { CouponRepository } from '../../../src/repositories/coupon-repository'
import {
  makeSaleWithBarber,
  makeService,
  defaultUnit,
} from '../../helpers/default-values'
import * as couponUtils from '../../../src/services/sale/utils/coupon'

class StubSaleRepository implements SaleRepository {
  constructor(private readonly sale: DetailedSale) {}

  async create(): Promise<DetailedSale> {
    throw new Error('Method not implemented: create')
  }

  async findMany(): Promise<DetailedSale[]> {
    throw new Error('Method not implemented: findMany')
  }

  async findManyPaginated(): Promise<{ items: DetailedSale[]; count: number }> {
    throw new Error('Method not implemented: findManyPaginated')
  }

  async findById(id: string): Promise<DetailedSale | null> {
    return id === this.sale.id ? this.sale : null
  }

  async update(): Promise<DetailedSale> {
    throw new Error('Method not implemented: update')
  }

  async findManyByDateRange(): Promise<DetailedSale[]> {
    throw new Error('Method not implemented: findManyByDateRange')
  }

  async findManyByUser(): Promise<DetailedSale[]> {
    throw new Error('Method not implemented: findManyByUser')
  }

  async findManyByBarber(): Promise<DetailedSale[]> {
    throw new Error('Method not implemented: findManyByBarber')
  }

  async findManyBySession(): Promise<DetailedSale[]> {
    throw new Error('Method not implemented: findManyBySession')
  }
}

class StubCouponRepository implements CouponRepository {
  private coupon: Coupon | null = null

  setCoupon(coupon: Coupon | null): void {
    this.coupon = coupon
  }

  async create(): Promise<Coupon> {
    throw new Error('Method not implemented: create')
  }

  async findMany(): Promise<Coupon[]> {
    throw new Error('Method not implemented: findMany')
  }

  async findManyPaginated(): Promise<{ items: Coupon[]; count: number }> {
    throw new Error('Method not implemented: findManyPaginated')
  }

  async findById(id: string): Promise<Coupon | null> {
    if (!this.coupon) return null
    return this.coupon.id === id ? this.coupon : null
  }

  async findByCode(): Promise<Coupon | null> {
    throw new Error('Method not implemented: findByCode')
  }

  async update(): Promise<Coupon> {
    throw new Error('Method not implemented: update')
  }

  async delete(): Promise<void> {
    throw new Error('Method not implemented: delete')
  }
}

function makeReturnBuildItem(
  overrides: Partial<ReturnBuildItemData>,
): ReturnBuildItemData {
  return {
    id: 'i1',
    coupon: null,
    quantity: 1,
    service: null,
    product: null,
    plan: null,
    barber: null,
    price: 100,
    basePrice: 100,
    customPrice: null,
    discounts: [],
    appointment: null,
    commissionPaid: false,
    ...overrides,
  }
}

function makeDetailedSaleItem(
  sale: DetailedSale,
  overrides: Partial<DetailedSaleItemFindById> = {},
): DetailedSaleItemFindById {
  const baseItem = sale.items[0]

  return {
    ...baseItem,
    sale,
    transactions: [],
    discounts: baseItem.discounts,
    appointment: (baseItem.appointment as any) ?? null,
    ...overrides,
  }
}

describe('SaleTotalsService - recalculateSaleTotalsOnItemChange', () => {
  let sale: DetailedSale
  let saleRepository: StubSaleRepository
  let couponRepository: StubCouponRepository

  beforeEach(() => {
    sale = makeSaleWithBarber()

    const service = makeService('svc-1', 100)
    sale.items[0].serviceId = service.id
    sale.items[0].service = service
    sale.gross_value = 100

    saleRepository = new StubSaleRepository(sale)
    couponRepository = new StubCouponRepository()
  })

  it('recalcula totais quando quantidade muda sem cupons aplicados', async () => {
    const currentItem = makeDetailedSaleItem(sale)
    const updatedItem: SaleItemBuildItem = {
      id: currentItem.id,
      saleId: currentItem.saleId,
      quantity: 2,
    }

    const currentBuilt = makeReturnBuildItem({
      quantity: 1,
      basePrice: 100,
      price: 100,
    })
    const updatedBuilt = makeReturnBuildItem({
      quantity: 2,
      basePrice: 200,
      price: 200,
    })

    const getItemBuildExecute = vi.fn(
      async ({ saleItem }: { saleItem: SaleItemBuildItem }) => {
        return {
          saleItemBuild: saleItem.quantity === 2 ? updatedBuilt : currentBuilt,
        }
      },
    )

    const saleTotalsService = new SaleTotalsService(
      saleRepository,
      couponRepository,
      {
        createGetItemBuildService: () => ({ execute: getItemBuildExecute }),
        createGetItemsBuildService: () => ({ execute: vi.fn() }),
      },
    )

    const result = await saleTotalsService.recalculateSaleTotalsOnItemChange({
      currentItem,
      updatedItem,
    })

    expect(result.totalSale).toBe(200)
    expect(result.grossTotalSale).toBe(200)
    expect(result.itemsForUpdate[0].quantity).toBe(2)
  })

  it('mantém total líquido, mas atualiza bruto quando preço efetivo permanece igual por custom price', async () => {
    sale.total = 50
    sale.gross_value = 100
    sale.items[0].customPrice = 50
    sale.items[0].price = 100
    sale.items[0].discounts = [
      {
        id: 'd-custom',
        amount: 50,
        type: DiscountType.VALUE,
        origin: DiscountOrigin.VALUE_SALE_ITEM,
        order: 1,
        saleItemId: 'i1',
      },
    ]

    const currentItem = makeDetailedSaleItem(sale, {
      customPrice: 50,
      discounts: sale.items[0].discounts,
    })

    const updatedItem: SaleItemBuildItem = {
      id: currentItem.id,
      saleId: currentItem.saleId,
      quantity: 2,
      customPrice: 50,
    }

    const currentBuilt = makeReturnBuildItem({
      quantity: 1,
      basePrice: 100,
      price: 100,
      discounts: [
        {
          amount: 50,
          type: DiscountType.VALUE,
          origin: DiscountOrigin.VALUE_SALE_ITEM,
          order: 1,
        },
      ],
      customPrice: 50,
    })

    const updatedBuilt = makeReturnBuildItem({
      quantity: 2,
      basePrice: 200,
      price: 200,
      discounts: [
        {
          amount: 150,
          type: DiscountType.VALUE,
          origin: DiscountOrigin.VALUE_SALE_ITEM,
          order: 1,
        },
      ],
      customPrice: 50,
    })

    const getItemBuildExecute = vi.fn(
      async ({ saleItem }: { saleItem: SaleItemBuildItem }) => {
        return {
          saleItemBuild: saleItem.quantity === 2 ? updatedBuilt : currentBuilt,
        }
      },
    )

    const saleTotalsService = new SaleTotalsService(
      saleRepository,
      couponRepository,
      {
        createGetItemBuildService: () => ({ execute: getItemBuildExecute }),
        createGetItemsBuildService: () => ({ execute: vi.fn() }),
      },
    )

    const result = await saleTotalsService.recalculateSaleTotalsOnItemChange({
      currentItem,
      updatedItem,
    })

    expect(result.totalSale).toBe(50)
    expect(result.grossTotalSale).toBe(200)
  })

  it('reaplica cupom de valor quando há desconto de sale e atualiza totais', async () => {
    sale.total = 90
    sale.gross_value = 100
    sale.couponId = 'coupon-sale'
    sale.coupon = {
      id: 'coupon-sale',
      code: 'SALE10',
      description: null,
      discount: 10,
      discountType: DiscountType.VALUE,
      imageUrl: null,
      quantity: 5,
      unitId: defaultUnit.id,
      createdAt: new Date(),
    }
    sale.items[0].discounts = [
      {
        id: 'd-sale',
        amount: 10,
        type: DiscountType.VALUE,
        origin: DiscountOrigin.COUPON_SALE,
        order: 1,
        saleItemId: 'i1',
      },
    ]

    couponRepository.setCoupon(sale.coupon)

    const currentItem = makeDetailedSaleItem(sale, {
      discounts: sale.items[0].discounts,
    })

    const updatedItem: SaleItemBuildItem = {
      id: currentItem.id,
      saleId: currentItem.saleId,
      quantity: 2,
    }

    const currentBuilt = makeReturnBuildItem({
      discounts: [
        {
          amount: 10,
          type: DiscountType.VALUE,
          origin: DiscountOrigin.COUPON_SALE,
          order: 1,
        },
      ],
    })

    const updatedBuilt = makeReturnBuildItem({
      quantity: 2,
      basePrice: 200,
      price: 200,
    })

    const getItemBuildExecute = vi.fn(
      async ({ saleItem }: { saleItem: SaleItemBuildItem }) => {
        return {
          saleItemBuild: saleItem.quantity === 2 ? updatedBuilt : currentBuilt,
        }
      },
    )

    const saleItemsBuildAfterRebuild: ReturnBuildItemData[] = [
      makeReturnBuildItem({
        quantity: 2,
        basePrice: 200,
        price: 200,
        discounts: [],
      }),
    ]

    const saleItemsAfterCoupon: ReturnBuildItemData[] = [
      makeReturnBuildItem({
        quantity: 2,
        basePrice: 200,
        price: 200,
        discounts: [
          {
            amount: 10,
            type: DiscountType.VALUE,
            origin: DiscountOrigin.COUPON_SALE,
            order: 1,
          },
        ],
      }),
    ]

    const getItemsBuildExecute = vi.fn(async () => ({
      saleItemsBuild: saleItemsBuildAfterRebuild,
    }))

    const applyCouponSaleSpy = vi
      .spyOn(couponUtils, 'applyCouponSale')
      .mockResolvedValue({
        couponIdConnect: 'coupon-sale',
        saleItems: saleItemsAfterCoupon,
      })

    try {
      const saleTotalsService = new SaleTotalsService(
        saleRepository,
        couponRepository,
        {
          createGetItemBuildService: () => ({ execute: getItemBuildExecute }),
          createGetItemsBuildService: () => ({ execute: getItemsBuildExecute }),
        },
      )

      const result = await saleTotalsService.recalculateSaleTotalsOnItemChange({
        currentItem,
        updatedItem,
      })

      expect(result.totalSale).toBe(190)
      expect(result.grossTotalSale).toBe(200)
      expect(result.itemsForUpdate[0].discounts.at(-1)).toMatchObject({
        origin: DiscountOrigin.COUPON_SALE,
        type: DiscountType.VALUE,
      })
      // expect(applyCouponSaleSpy).toHaveBeenCalledOnce()
    } finally {
      applyCouponSaleSpy.mockRestore()
    }
  })
})
