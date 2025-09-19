import { CouponRepository } from '@/repositories/coupon-repository'
import { ProductRepository } from '@/repositories/product-repository'
import {
  DetailedSale,
  DetailedSaleItem,
  SaleRepository,
} from '@/repositories/sale-repository'
import { PlanProfileRepository } from '@/repositories/plan-profile-repository'
import { PlanRepository } from '@/repositories/plan-repository'
import { DiscountOrigin, DiscountType, Prisma } from '@prisma/client'
import {
  calculateRealValueSaleItem,
  ReturnBuildItemData,
  SaleItemBuildItem,
} from './item'
import { applyCouponSale } from './coupon'
import { DetailedSaleItemFindById } from '@/repositories/sale-item-repository'
import { CreateSaleItem } from '../types'
import { SaleNotFoundError } from '@/services/@errors/sale/sale-not-found-error'
import { makeGetItemsBuildService } from '@/services/@factories/sale/make-get-items-build'
import { makeGetItemBuildService } from '@/services/@factories/sale/make-get-item-build'
import { GetItemsBuildService } from '../get-items-build'

export function mapToSaleItem(
  saleItem: ReturnBuildItemData,
): Prisma.SaleItemCreateWithoutSaleInput {
  return {
    coupon: saleItem.coupon
      ? { connect: { id: saleItem.coupon.id } }
      : undefined,
    quantity: saleItem.quantity,
    service: saleItem.service
      ? { connect: { id: saleItem.service.id } }
      : undefined,
    product: saleItem.product
      ? { connect: { id: saleItem.product.id } }
      : undefined,
    plan: saleItem.plan ? { connect: { id: saleItem.plan.id } } : undefined,
    barber: saleItem.barber
      ? { connect: { id: saleItem.barber.id } }
      : undefined,
    price: saleItem.price,
    customPrice: saleItem.customPrice,
    discounts: {
      create: saleItem.discounts.map((d) => ({
        amount: d.amount,
        type: d.type,
        origin: d.origin,
        order: d.order,
      })),
    },
    appointment: saleItem.appointment
      ? { connect: { id: saleItem.appointment.id } }
      : undefined,
    commissionPaid: false,
  }
}

export function mapToSaleItemForUpdate(
  saleItem: ReturnBuildItemData,
): Prisma.SaleItemUpdateWithoutSaleInput {
  return {
    id: saleItem.id,
    coupon:
      saleItem.coupon === null
        ? { disconnect: true }
        : saleItem.coupon
        ? { connect: { id: saleItem.coupon.id } }
        : undefined,
    quantity: saleItem.quantity,
    service:
      saleItem.service === null
        ? { disconnect: true }
        : saleItem.service
        ? { connect: { id: saleItem.service.id } }
        : undefined,
    product:
      saleItem.product === null
        ? { disconnect: true }
        : saleItem.product
        ? { connect: { id: saleItem.product.id } }
        : undefined,
    plan:
      saleItem.plan === null
        ? { disconnect: true }
        : saleItem.plan
        ? { connect: { id: saleItem.plan.id } }
        : undefined,
    barber:
      saleItem.barber === null
        ? { disconnect: true }
        : saleItem.barber
        ? { connect: { id: saleItem.barber.id } }
        : undefined,
    price: saleItem.price,
    customPrice: saleItem.customPrice,
    discounts: {
      deleteMany: {},
      create: saleItem.discounts.map((d) => ({
        amount: d.amount,
        type: d.type,
        origin: d.origin,
        order: d.order,
      })),
    },
    appointment:
      saleItem.appointment === null
        ? { disconnect: true }
        : saleItem.appointment
        ? { connect: { id: saleItem.appointment.id } }
        : undefined,
  }
}

export function mapToSaleItemsForUpdate(
  saleItems: ReturnBuildItemData[],
): Prisma.SaleItemUpdateWithoutSaleInput[] {
  return saleItems.map(
    (saleItem): Prisma.SaleItemUpdateWithoutSaleInput =>
      mapToSaleItemForUpdate(saleItem),
  )
}
export function mapToSaleItems(
  saleItems: ReturnBuildItemData[],
): Prisma.SaleItemCreateWithoutSaleInput[] {
  return saleItems.map(
    (saleItem): Prisma.SaleItemCreateWithoutSaleInput =>
      mapToSaleItem(saleItem),
  )
}

export function calculateTotal(saleItemsBuild: ReturnBuildItemData[]): number {
  return saleItemsBuild.reduce((acc, i) => {
    const realPriceItem = calculateRealValueSaleItem(i.price, i.discounts)
    return acc + realPriceItem
  }, 0)
}

export function calculateGrossTotal(
  saleItemsBuild: ReturnBuildItemData[],
): number {
  return saleItemsBuild.reduce((acc, i) => acc + i.basePrice, 0)
}

export async function updateProductsStock(
  repository: ProductRepository,
  products: { id: string; quantity: number }[],
  mode: 'increment' | 'decrement' = 'decrement',
  tx?: Prisma.TransactionClient,
): Promise<void> {
  for (const prod of products) {
    await repository.update(
      prod.id,
      {
        quantity: { [mode]: prod.quantity },
      },
      tx,
    )
  }
}

export async function updateCouponsStock(
  repository: CouponRepository,
  items: DetailedSaleItem[],
  mode: 'increment' | 'decrement' = 'decrement',
  tx?: Prisma.TransactionClient,
): Promise<void> {
  for (const item of items) {
    if (!item.couponId) continue
    await repository.update(
      item.couponId,
      {
        quantity: { [mode]: 1 },
      },
      tx,
    )
  }
}

export interface RebuildSaleItemsOptions {
  couponId?: string
  clientId: string
  planProfileRepository: PlanProfileRepository
  planRepository: PlanRepository
  couponRepository: CouponRepository
}

export async function rebuildSaleItems(
  saleItems: ReturnBuildItemData[],
  { couponId, couponRepository }: RebuildSaleItemsOptions,
): Promise<ReturnBuildItemData[]> {
  let updatedItems = saleItems

  if (couponId) {
    const { saleItems } = await applyCouponSale(
      updatedItems,
      couponId,
      couponRepository,
    )
    updatedItems = saleItems
  }

  return updatedItems
}

export function haveADiscountCouponSaleValue(saleItem: ReturnBuildItemData) {
  const discountsCouponSaleTypeValue = saleItem.discounts.filter(
    (discount) =>
      discount.origin === DiscountOrigin.COUPON_SALE &&
      discount.type === DiscountType.VALUE,
  )
  return discountsCouponSaleTypeValue.length > 0
}

function getRealPriceItem(
  saleItemUpdated: ReturnBuildItemData | NonNullable<DetailedSaleItemFindById>,
): number {
  return calculateRealValueSaleItem(
    saleItemUpdated.price,
    saleItemUpdated.discounts,
  )
}

export type GetItemsBuildReturn = {
  saleItemsBuild: ReturnBuildItemData[]
}

export async function recalculateSaleTotalsOnItemChange(
  saleItemCurrent: NonNullable<DetailedSaleItemFindById>,
  saleItemUpdated: CreateSaleItem,
  saleRepository: SaleRepository,
  couponRepository: CouponRepository,
): Promise<{
  itemsForUpdate: ReturnBuildItemData[]
  totalSale: number
  grossTotalSale: number
}> {
  const getItemsBuild = makeGetItemsBuildService()
  const getItemBuild = makeGetItemBuildService()
  // 1) Construir versão atualizada do item
  const { saleItemBuild: updatedItem } = await getItemBuild.execute({
    saleItem: { ...saleItemUpdated, saleId: saleItemCurrent.saleId },
    unitId: saleItemCurrent.sale.unitId,
  })

  // 2) Buscar venda e construir versão atual do item (para comparação)
  const sale = await getRequiredSaleById(saleItemCurrent.saleId, saleRepository)
  const { saleItemBuild: currentItemBuilt } = await getItemBuild.execute({
    saleItem: { ...saleItemCurrent, saleId: saleItemCurrent.saleId },
    unitId: saleItemCurrent.sale.unitId,
  })
  // 3) Preparar preços efetivos e valores-base
  const newEffectivePrice = getRealPriceItem(updatedItem)
  const oldEffectivePrice = getRealPriceItem(currentItemBuilt)

  let itemsForUpdate: ReturnBuildItemData[] = [updatedItem]
  let totalSale = sale.total
  let grossTotalSale = sale.gross_value

  // 4) Só recalcular se o preço efetivo do item mudou
  if (newEffectivePrice !== oldEffectivePrice) {
    console.log('Rebuild sale com cupom')

    // Importante: a regra original decide rebuild global usando esta verificação
    const mustRebuildAll = haveADiscountCouponSaleValue(currentItemBuilt)

    if (mustRebuildAll) {
      console.log('Sale com cupom, rebuild de todos os items')

      const { items, total, grossTotal } = await rebuildAllItemsApplyingCoupon({
        sale,
        saleItemCurrentId: saleItemCurrent.id,
        saleItemUpdated,
        getItemsBuild,
        couponRepository,
      })

      itemsForUpdate = items
      totalSale = total
      grossTotalSale = grossTotal
    } else {
      // Sem rebuild global: apenas ajusta totais pela diferença do item
      const adjusted = adjustTotalsWithoutCoupon({
        baseTotal: sale.total,
        baseGrossTotal: sale.gross_value,
        newEffectivePrice,
        oldEffectivePrice,
        newBasePrice: updatedItem.basePrice,
        oldBasePrice: saleItemCurrent.price,
      })
      totalSale = adjusted.total
      grossTotalSale = adjusted.grossTotal
    }
  }

  return { itemsForUpdate, totalSale, grossTotalSale }
}

/* ======================= Helpers reutilizáveis / genéricos ======================= */

/** Garante que a venda exista; lança erro se não encontrada. */
async function getRequiredSaleById(
  saleId: string,
  saleRepository: SaleRepository,
) {
  const sale = await saleRepository.findById(saleId)
  if (!sale) throw new SaleNotFoundError()
  return sale
}

/**
 * Rebuild global dos itens quando há cupom:
 * - Substitui o item alterado
 * - Zera descontos temporariamente
 * - Rebuild de todos
 * - Reaplica o cupom da venda
 * - Recalcula totais
 */
async function rebuildAllItemsApplyingCoupon(params: {
  sale: DetailedSale
  saleItemCurrentId: string
  saleItemUpdated: CreateSaleItem
  getItemsBuild: GetItemsBuildService
  couponRepository: CouponRepository
}): Promise<{
  items: ReturnBuildItemData[]
  total: number
  grossTotal: number
}> {
  const { sale, saleItemCurrentId, saleItemUpdated } = params

  const itemsRebuildPayload = mapItemsReplacingAndClearingDiscounts({
    items: sale.items,
    saleId: sale.id,
    targetItemId: saleItemCurrentId,
    replacementPatch: saleItemUpdated,
  })

  const { saleItemsBuild } = await params.getItemsBuild.execute({
    saleItems: itemsRebuildPayload,
    unitId: sale.unitId,
  })

  const { saleItems } = await applyCouponSale(
    saleItemsBuild,
    sale.couponId ?? '',
    params.couponRepository,
  )

  return {
    items: saleItems,
    total: calculateTotal(saleItems),
    grossTotal: calculateGrossTotal(saleItems),
  }
}

/**
 * Mapeia itens da venda substituindo o item-alvo pelo patch atualizado
 * e limpando a lista de descontos de todos. Mantém demais campos.
 */
function mapItemsReplacingAndClearingDiscounts(params: {
  items: SaleItemBuildItem[]
  saleId: string
  targetItemId: string
  replacementPatch: CreateSaleItem
}): SaleItemBuildItem[] {
  const { items, saleId, targetItemId, replacementPatch } = params

  return items.map((item) =>
    item.id === targetItemId
      ? { ...item, ...replacementPatch, saleId, discounts: [] }
      : { ...item, saleId, discounts: [] },
  )
}

/**
 * Ajusta totais quando não há rebuild global com cupom.
 * Mantém as fórmulas originais:
 * - total += (preço efetivo novo - preço efetivo antigo)
 * - grossTotal += (basePrice novo - basePrice antigo)
 */
function adjustTotalsWithoutCoupon(params: {
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
