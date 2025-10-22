import { CreateSaleItem } from '@/modules/sale/application/dto/sale'
import { SaleItemValidationError } from '../errors/sale-item-validation-error'
import { DetailedSaleItemFindById } from '@/modules/sale/application/ports/sale-item-repository'

export interface SaleItemTypePayload {
  serviceId?: string | null
  productId?: string | null
  appointmentId?: string | null
  planId?: string | null
}

export function ensureSaleItemIdProvided(id: string | undefined): string {
  if (!id) {
    throw new SaleItemValidationError('Sale item identifier is required')
  }

  return id
}

export function validateSaleItemQuantity(quantity?: number): void {
  if (quantity === undefined) return
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new SaleItemValidationError(
      'Sale item quantity must be greater than zero',
    )
  }
}

export function validateSaleItemQuantityChanged(
  saleItemCurrent: NonNullable<DetailedSaleItemFindById>,
  saleItemUpdated: CreateSaleItem,
): void {
  if (saleItemCurrent.quantity === saleItemUpdated.quantity) {
    throw new SaleItemValidationError('Quantity has not changed')
  }
}

export function validateSaleItemCustomPrice(customPrice?: number | null): void {
  if (customPrice === undefined) return
  if (!Number.isFinite(customPrice ?? 0) || (customPrice ?? 0) < 0) {
    throw new SaleItemValidationError(
      'Sale item custom price must be greater than or equal to zero',
    )
  }
}

export function ensureSingleItemType(payload: SaleItemTypePayload): void {
  const nonNullFields = [
    payload.serviceId,
    payload.productId,
    payload.appointmentId,
    payload.planId,
  ].filter((field) => field !== undefined && field !== null)

  if (nonNullFields.length > 1) {
    throw new SaleItemValidationError(
      'Only one sale item type (service, product, appointment or plan) can be provided at a time',
    )
  }
}

export function ensureHasChanges(
  payload: Partial<Record<string, unknown>>,
): void {
  const hasChange = Object.values(payload).some((value) => value !== undefined)

  if (!hasChange) {
    throw new SaleItemValidationError(
      'No changes provided for sale item update',
    )
  }
}
