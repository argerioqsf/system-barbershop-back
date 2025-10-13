import { BarberProductRepository } from '../barber-product-repository'
import { BarberProduct, CommissionCalcType, Prisma } from '@prisma/client'
import { randomUUID } from 'crypto'

const DEFAULT_COMMISSION_TYPE = CommissionCalcType.PERCENTAGE_OF_ITEM

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (
    value &&
    typeof value === 'object' &&
    'toNumber' in value &&
    typeof (value as { toNumber: () => number }).toNumber === 'function'
  ) {
    return (value as { toNumber: () => number }).toNumber()
  }
  return Number(value ?? 0)
}

function resolveNullableFloat(
  value: unknown,
  fallback: number | null,
): number | null {
  if (value === undefined) return fallback
  if (value === null) return null
  if (
    typeof value === 'object' &&
    value !== null &&
    'set' in (value as Record<string, unknown>)
  ) {
    const setValue = (value as { set?: unknown }).set
    return resolveNullableFloat(setValue ?? null, fallback)
  }
  return toNumber(value)
}

function resolveCommissionType(
  value: unknown,
  fallback: CommissionCalcType,
): CommissionCalcType {
  if (value === undefined || value === null) return fallback
  if (typeof value === 'string') {
    return Object.values(CommissionCalcType).includes(
      value as CommissionCalcType,
    )
      ? (value as CommissionCalcType)
      : fallback
  }
  if (
    typeof value === 'object' &&
    value !== null &&
    'set' in (value as Record<string, unknown>)
  ) {
    const setValue = (value as { set?: CommissionCalcType | null }).set
    return resolveCommissionType(setValue ?? null, fallback)
  }
  return fallback
}

export class InMemoryBarberProductRepository
  implements BarberProductRepository
{
  constructor(public items: BarberProduct[] = []) {}

  private buildBarberProduct(data: {
    id?: string
    profileId: string
    productId: string
    commissionPercentage?: number | null
    commissionType?: CommissionCalcType
  }): BarberProduct {
    return {
      id: data.id ?? randomUUID(),
      profileId: data.profileId,
      productId: data.productId,
      commissionPercentage:
        data.commissionPercentage === undefined
          ? null
          : data.commissionPercentage,
      commissionType: data.commissionType ?? DEFAULT_COMMISSION_TYPE,
    }
  }

  async create(
    data: Prisma.BarberProductUncheckedCreateInput,
  ): Promise<BarberProduct> {
    const commissionPercentage = resolveNullableFloat(
      data.commissionPercentage,
      null,
    )
    const commissionType = resolveCommissionType(
      data.commissionType,
      DEFAULT_COMMISSION_TYPE,
    )

    const product = this.buildBarberProduct({
      id: (data as { id?: string }).id,
      profileId: data.profileId,
      productId: data.productId,
      commissionPercentage,
      commissionType,
    })

    this.items.push(product)
    return product
  }

  async findByProfileProduct(
    profileId: string,
    productId: string,
  ): Promise<BarberProduct | null> {
    return (
      this.items.find(
        (item) => item.profileId === profileId && item.productId === productId,
      ) ?? null
    )
  }

  async update(
    profileId: string,
    productId: string,
    data: Prisma.BarberProductUncheckedUpdateInput,
  ): Promise<BarberProduct> {
    const index = this.items.findIndex(
      (item) => item.profileId === profileId && item.productId === productId,
    )

    const commissionPercentage = resolveNullableFloat(
      data.commissionPercentage,
      index >= 0 ? this.items[index].commissionPercentage : null,
    )
    const commissionType = resolveCommissionType(
      data.commissionType,
      index >= 0 ? this.items[index].commissionType : DEFAULT_COMMISSION_TYPE,
    )

    if (index === -1) {
      const created = this.buildBarberProduct({
        profileId,
        productId,
        commissionPercentage,
        commissionType,
      })
      this.items.push(created)
      return created
    }

    const updated: BarberProduct = {
      ...this.items[index],
      commissionPercentage,
      commissionType,
    }
    this.items[index] = updated
    return updated
  }

  async deleteByProfileProduct(
    profileId: string,
    productId: string,
  ): Promise<void> {
    const idx = this.items.findIndex(
      (item) => item.profileId === profileId && item.productId === productId,
    )
    if (idx !== -1) {
      this.items.splice(idx, 1)
    }
  }
}
