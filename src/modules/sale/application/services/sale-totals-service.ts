import { SaleNotFoundError } from '@/services/@errors/sale/sale-not-found-error'
import { makeGetItemBuildService } from '@/modules/sale/infra/factories/make-get-item-build'
import { CreateSaleItem } from '@/services/sale/types'
import {
  calculateRealValueSaleItem,
  ReturnBuildItemData,
  SaleItemBuildItem,
} from '@/services/sale/utils/item'
import { applyCouponSale } from '@/services/sale/utils/coupon'
import { CouponRepository } from '@/repositories/coupon-repository'
import { DetailedSaleItemFindById } from '@/repositories/sale-item-repository'
import {
  DetailedSale,
  SaleRepository,
  DetailedSaleItem,
} from '@/repositories/sale-repository'
import { DiscountType } from '@prisma/client'
import { makeGetItemsBuildService } from '@/modules/sale/infra/factories/make-get-items-build'
import { logger } from '@/lib/logger'

type SaleItemSourceForBuild =
  | CreateSaleItem
  | NonNullable<DetailedSaleItemFindById>
  | DetailedSaleItem

export interface RecalculateSaleTotalsOnItemChangeParams {
  currentItem: NonNullable<DetailedSaleItemFindById>
  updatedItem: CreateSaleItem
}

export interface RecalculateSaleTotalsOnItemChangeResult {
  itemsForUpdate: ReturnBuildItemData[]
  totalSale: number
  grossTotalSale: number
}

type CreateGetItemBuildService = typeof makeGetItemBuildService

export class SaleTotalsService {
  private readonly createGetItemBuildService: CreateGetItemBuildService
  private readonly createGetItemsBuildService: typeof makeGetItemsBuildService

  constructor(
    private readonly saleRepository: SaleRepository,
    private readonly couponRepository: CouponRepository,
    factories?: {
      createGetItemBuildService?: CreateGetItemBuildService
      createGetItemsBuildService?: typeof makeGetItemsBuildService
    },
  ) {
    this.createGetItemBuildService =
      factories?.createGetItemBuildService ?? makeGetItemBuildService
    this.createGetItemsBuildService =
      factories?.createGetItemsBuildService ?? makeGetItemsBuildService
  }

  async recalculateSaleTotalsOnItemChange({
    currentItem,
    updatedItem,
  }: RecalculateSaleTotalsOnItemChangeParams): Promise<RecalculateSaleTotalsOnItemChangeResult> {
    logger.info('Start Logger', {
      name: this.recalculateSaleTotalsOnItemChange.name,
    })
    const sale = await this.loadSaleOrThrow(currentItem.saleId)
    const getItemBuild = this.createGetItemBuildService()

    const [updatedItemBuilt, currentItemBuilt] = await Promise.all([
      this.buildSaleItemForSale(getItemBuild, sale, updatedItem),
      this.buildSaleItemForSale(getItemBuild, sale, currentItem),
    ])
    let itemForUpdate = updatedItemBuilt

    const newEffectivePrice = this.getEffectivePrice(updatedItemBuilt)
    const oldEffectivePrice = this.getEffectivePrice(currentItemBuilt)
    const basePriceDelta =
      updatedItemBuilt.basePrice - currentItemBuilt.basePrice
    const quantityChanged =
      updatedItemBuilt.quantity !== currentItemBuilt.quantity
    const hasBasePriceDelta = Math.abs(basePriceDelta) > Number.EPSILON

    if (newEffectivePrice === oldEffectivePrice) {
      logger.debug('No price change', { newEffectivePrice, oldEffectivePrice })
      const grossTotalSale =
        quantityChanged && hasBasePriceDelta
          ? sale.gross_value + basePriceDelta
          : sale.gross_value
      return {
        itemsForUpdate: [updatedItemBuilt],
        totalSale: sale.total,
        grossTotalSale,
      }
    }
    logger.debug('Price change', { newEffectivePrice, oldEffectivePrice })

    if (sale.couponId) {
      logger.debug('Sale have a coupon', { couponId: sale.couponId })
      if (sale.coupon?.discountType === DiscountType.VALUE) {
        logger.debug('Has coupon value discount')
        const getItemsBuild = this.createGetItemsBuildService()
        const { items, total, grossTotal } =
          await this.rebuildAllItemsApplyingCoupon({
            sale,
            saleItemCurrentId: currentItem.id,
            saleItemUpdated: updatedItem,
            getItemsBuild,
          })
        return {
          itemsForUpdate: items,
          totalSale: total,
          grossTotalSale: grossTotal,
        }
      }
      if (sale.coupon?.discountType === DiscountType.PERCENTAGE) {
        logger.debug('Has coupon percentage discount')
        const { saleItems } = await applyCouponSale(
          [updatedItemBuilt],
          sale.couponId,
          this.couponRepository,
          sale.unitId,
        )
        itemForUpdate = saleItems[0]
        logger.debug('itemForUpdate', { itemForUpdate })
      }
    }

    const adjustedTotals = this.applyTotalsDelta({
      baseTotal: sale.total,
      baseGrossTotal: sale.gross_value,
      newEffectivePrice,
      oldEffectivePrice,
      newBasePrice: itemForUpdate.basePrice,
      oldBasePrice: currentItemBuilt.basePrice,
    })

    return {
      itemsForUpdate: [itemForUpdate],
      totalSale: adjustedTotals.total,
      grossTotalSale: adjustedTotals.grossTotal,
    }
  }

  private getEffectivePrice(
    saleItem: ReturnBuildItemData | NonNullable<DetailedSaleItemFindById>,
  ): number {
    const base = saleItem.price
    return calculateRealValueSaleItem(base, saleItem.discounts)
  }

  private mapToSaleItemBuildInput(
    saleId: string,
    source: SaleItemSourceForBuild,
  ): SaleItemBuildItem {
    const base: SaleItemBuildItem = {
      saleId,
      quantity: source.quantity,
    }

    const keys: Array<keyof CreateSaleItem> = [
      'id',
      'serviceId',
      'productId',
      'appointmentId',
      'planId',
      'barberId',
      'couponId',
      'price',
      'customPrice',
    ]

    for (const key of keys) {
      if (key in source) {
        ;(base as Record<string, unknown>)[key] = (
          source as Record<string, unknown>
        )[key]
      }
    }

    return base
  }

  private async buildSaleItemForSale(
    getItemBuild: ReturnType<CreateGetItemBuildService>,
    sale: DetailedSale,
    rawItem: SaleItemSourceForBuild,
  ): Promise<ReturnBuildItemData> {
    const saleItem = this.mapToSaleItemBuildInput(sale.id, rawItem)
    const { saleItemBuild } = await getItemBuild.execute({
      saleItem,
      unitId: sale.unitId,
    })
    return saleItemBuild
  }

  private mergeSaleItemPatch(
    base: SaleItemBuildItem,
    patch: CreateSaleItem,
  ): SaleItemBuildItem {
    const merged: SaleItemBuildItem = { ...base }
    const keys: Array<keyof CreateSaleItem> = [
      'id',
      'quantity',
      'serviceId',
      'productId',
      'appointmentId',
      'planId',
      'barberId',
      'couponId',
      'price',
      'customPrice',
    ]

    for (const key of keys) {
      if (key in patch) {
        ;(merged as Record<string, unknown>)[key] = (
          patch as Record<string, unknown>
        )[key]
      }
    }

    return merged
  }

  private prepareItemsForCouponRebuild(params: {
    sale: DetailedSale
    targetItemId: string
    replacementPatch: CreateSaleItem
  }): SaleItemBuildItem[] {
    const { sale, targetItemId, replacementPatch } = params

    return sale.items.map((item) => {
      const normalized = this.mapToSaleItemBuildInput(sale.id, item)
      const patched =
        item.id === targetItemId
          ? this.mergeSaleItemPatch(normalized, replacementPatch)
          : normalized

      return {
        ...patched,
        saleId: sale.id,
        discounts: [],
      }
    })
  }

  private calculateTotalsFromItems(items: ReturnBuildItemData[]): {
    total: number
    grossTotal: number
  } {
    return {
      total: this.calculateTotal(items),
      grossTotal: this.calculateGrossTotal(items),
    }
  }

  private applyTotalsDelta(params: {
    baseTotal: number
    baseGrossTotal: number
    newEffectivePrice: number
    oldEffectivePrice: number
    newBasePrice: number
    oldBasePrice: number
  }): { total: number; grossTotal: number } {
    const {
      baseTotal,
      baseGrossTotal,
      newEffectivePrice,
      oldEffectivePrice,
      newBasePrice,
      oldBasePrice,
    } = params

    return {
      total: baseTotal + (newEffectivePrice - oldEffectivePrice),
      grossTotal: baseGrossTotal + (newBasePrice - oldBasePrice),
    }
  }

  private async loadSaleOrThrow(saleId: string): Promise<DetailedSale> {
    const sale = await this.saleRepository.findById(saleId)
    if (!sale) throw new SaleNotFoundError()
    return sale
  }

  private async rebuildAllItemsApplyingCoupon(params: {
    sale: DetailedSale
    saleItemCurrentId: string
    saleItemUpdated: CreateSaleItem
    getItemsBuild: ReturnType<typeof makeGetItemsBuildService>
  }): Promise<{
    items: ReturnBuildItemData[]
    total: number
    grossTotal: number
  }> {
    const { sale, saleItemCurrentId, saleItemUpdated, getItemsBuild } = params

    const saleItemsPayload = this.prepareItemsForCouponRebuild({
      sale,
      targetItemId: saleItemCurrentId,
      replacementPatch: saleItemUpdated,
    })

    const { saleItemsBuild } = await getItemsBuild.execute({
      saleItems: saleItemsPayload,
      unitId: sale.unitId,
    })

    if (!sale.couponId) {
      return {
        items: saleItemsBuild,
        ...this.calculateTotalsFromItems(saleItemsBuild),
      }
    }

    const { saleItems } = await applyCouponSale(
      saleItemsBuild,
      sale.couponId,
      this.couponRepository,
      sale.unitId,
    )

    return {
      items: saleItems,
      ...this.calculateTotalsFromItems(saleItems),
    }
  }

  private calculateTotal(items: ReturnBuildItemData[]): number {
    return items.reduce((total, item) => {
      const effectivePrice = calculateRealValueSaleItem(
        item.price,
        item.discounts,
      )
      return total + effectivePrice
    }, 0)
  }

  private calculateGrossTotal(items: ReturnBuildItemData[]): number {
    return items.reduce((total, item) => total + item.basePrice, 0)
  }
}
