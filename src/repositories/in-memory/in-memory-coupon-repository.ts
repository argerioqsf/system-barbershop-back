import { Prisma, Coupon } from '@prisma/client'
import { CouponRepository } from '../coupon-repository'
import { randomUUID } from 'crypto'

export class InMemoryCouponRepository implements CouponRepository {
  constructor(public coupons: Coupon[] = []) {}

  async create(data: Prisma.CouponCreateInput): Promise<Coupon> {
    const coupon: Coupon = {
      id: randomUUID(),
      code: data.code,
      description: (data.description as string | null) ?? null,
      discount: data.discount as number,
      discountType: data.discountType as any,
      imageUrl: (data.imageUrl as string | null) ?? null,
      quantity: (data.quantity as number) ?? 0,
      unitId: (data.unit as any).connect.id,
      createdAt: new Date(),
    }
    this.coupons.push(coupon)
    return coupon
  }

  async findMany(where: Prisma.CouponWhereInput = {}): Promise<Coupon[]> {
    return this.coupons.filter((c: any) => {
      if (where.unitId && c.unitId !== where.unitId) return false
      if (where.unit && 'organizationId' in (where.unit as any)) {
        return c.organizationId === (where.unit as any).organizationId
      }
      return true
    })
  }

  async findById(id: string): Promise<Coupon | null> {
    return this.coupons.find((c) => c.id === id) ?? null
  }

  async findByCode(code: string): Promise<Coupon | null> {
    return this.coupons.find((c) => c.code === code) ?? null
  }

  async update(id: string, data: Prisma.CouponUpdateInput): Promise<Coupon> {
    const coupon = this.coupons.find((c) => c.id === id)
    if (!coupon) throw new Error('Coupon not found')
    if (
      data.quantity &&
      typeof data.quantity === 'object' &&
      'decrement' in data.quantity
    ) {
      coupon.quantity -= data.quantity.decrement as number
    }
    return coupon
  }

  async delete(id: string): Promise<void> {
    this.coupons = this.coupons.filter((c) => c.id !== id)
  }
}
