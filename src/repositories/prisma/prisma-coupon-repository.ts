import { prisma } from '@/lib/prisma'
import { Prisma, Coupon } from '@prisma/client'
import { CouponRepository } from '../coupon-repository'

export class PrismaCouponRepository implements CouponRepository {
  async create(data: Prisma.CouponCreateInput): Promise<Coupon> {
    return prisma.coupon.create({ data })
  }

  async findMany(): Promise<Coupon[]> {
    return prisma.coupon.findMany()
  }

  async findById(id: string): Promise<Coupon | null> {
    return prisma.coupon.findUnique({ where: { id } })
  }

  async delete(id: string): Promise<void> {
    await prisma.coupon.delete({ where: { id } })
  }
}
