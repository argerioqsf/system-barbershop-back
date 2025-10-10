import { BarberServiceRepository } from '../barber-service-repository'
import { BarberService, CommissionCalcType, Prisma } from '@prisma/client'
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

function resolveNullableInt(
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
    return resolveNullableInt(setValue ?? null, fallback)
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

export class InMemoryBarberServiceRepository
  implements BarberServiceRepository
{
  constructor(public items: BarberService[] = []) {}

  private buildBarberService(data: {
    id?: string
    profileId: string
    serviceId: string
    time?: number | null
    commissionPercentage?: number | null
    commissionType?: CommissionCalcType
  }): BarberService {
    return {
      id: data.id ?? randomUUID(),
      profileId: data.profileId,
      serviceId: data.serviceId,
      time: data.time ?? null,
      commissionPercentage:
        data.commissionPercentage === undefined
          ? null
          : data.commissionPercentage,
      commissionType: data.commissionType ?? DEFAULT_COMMISSION_TYPE,
    }
  }

  async create(
    data: Prisma.BarberServiceUncheckedCreateInput,
  ): Promise<BarberService> {
    const service = this.buildBarberService({
      id: (data as { id?: string }).id,
      profileId: data.profileId,
      serviceId: data.serviceId,
      time: resolveNullableInt(data.time, null),
      commissionPercentage: resolveNullableFloat(
        data.commissionPercentage,
        null,
      ),
      commissionType: resolveCommissionType(
        data.commissionType,
        DEFAULT_COMMISSION_TYPE,
      ),
    })

    this.items.push(service)
    return service
  }

  async findByProfileService(
    profileId: string,
    serviceId: string,
  ): Promise<BarberService | null> {
    return (
      this.items.find(
        (item) => item.profileId === profileId && item.serviceId === serviceId,
      ) ?? null
    )
  }

  async update(
    profileId: string,
    serviceId: string,
    data: Prisma.BarberServiceUncheckedUpdateInput,
  ): Promise<BarberService> {
    const index = this.items.findIndex(
      (item) => item.profileId === profileId && item.serviceId === serviceId,
    )

    const current = index >= 0 ? this.items[index] : undefined
    const time = resolveNullableInt(data.time, current?.time ?? null)
    const commissionPercentage = resolveNullableFloat(
      data.commissionPercentage,
      current?.commissionPercentage ?? null,
    )
    const commissionType = resolveCommissionType(
      data.commissionType,
      current?.commissionType ?? DEFAULT_COMMISSION_TYPE,
    )

    if (!current) {
      const created = this.buildBarberService({
        profileId,
        serviceId,
        time,
        commissionPercentage,
        commissionType,
      })
      this.items.push(created)
      return created
    }

    const updated: BarberService = {
      ...current,
      time,
      commissionPercentage,
      commissionType,
    }
    this.items[index] = updated
    return updated
  }

  async deleteByProfileService(
    profileId: string,
    serviceId: string,
  ): Promise<void> {
    const idx = this.items.findIndex(
      (item) => item.profileId === profileId && item.serviceId === serviceId,
    )
    if (idx !== -1) {
      this.items.splice(idx, 1)
    }
  }
}
