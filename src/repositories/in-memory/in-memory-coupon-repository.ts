import { Prisma, Coupon, DiscountType } from '@prisma/client'
import { CouponRepository } from '../coupon-repository'
import { randomUUID } from 'crypto'

export class InMemoryCouponRepository implements CouponRepository {
  constructor(public coupons: Coupon[] = []) {}

  async create(
    data: Prisma.CouponCreateInput,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _tx?: Prisma.TransactionClient,
  ): Promise<Coupon> {
    const coupon: Coupon = {
      id: randomUUID(),
      code: data.code,
      description: (data.description as string | null) ?? null,
      discount: data.discount as number,
      discountType: data.discountType as DiscountType,
      imageUrl: (data.imageUrl as string | null) ?? null,
      quantity: (data.quantity as number) ?? 0,
      unitId: (data.unit as { connect: { id: string } }).connect.id,
      createdAt: new Date(),
    }
    this.coupons.push({
      ...coupon,
      unit: {
        id: coupon.unitId,
        name: '',
        slug: '',
        organizationId: 'org-1',
        totalBalance: 0,
        allowsLoan: false,
        loanMonthlyLimit: 0,
        slotDuration: 60,
        appointmentFutureLimitDays: 7,
      },
    } as Coupon & { unit: { organizationId: string } })
    return coupon
  }

  async findMany(where: Prisma.CouponWhereInput = {}): Promise<Coupon[]> {
    return this.coupons.filter((c) => {
      if (where.unitId && c.unitId !== where.unitId) return false
      if (
        where.unit &&
        'organizationId' in (where.unit as { organizationId: string })
      ) {
        const orgId = (where.unit as { organizationId: string }).organizationId
        const unitOrg = (c as { unit?: { organizationId?: string } }).unit
          ?.organizationId
        const couponOrg = (c as { organizationId?: string }).organizationId
        return unitOrg ? unitOrg === orgId : couponOrg === orgId
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

  async findManyPaginated(
    where: Prisma.CouponWhereInput,
    page: number,
    perPage: number,
  ): Promise<{ items: Coupon[]; count: number }> {
    const all = await this.findMany(where)
    const count = all.length
    const items = all.slice(
      (page - 1) * perPage,
      (page - 1) * perPage + perPage,
    )
    return { items, count }
  }

  async update(
    id: string,
    data: Prisma.CouponUpdateInput,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _tx?: Prisma.TransactionClient,
  ): Promise<Coupon> {
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async delete(id: string, _tx?: Prisma.TransactionClient): Promise<void> {
    this.coupons = this.coupons.filter((c) => c.id !== id)
  }
}
