import { prisma } from '@/lib/prisma'
import { Prisma, Coupon } from '@prisma/client'
import { CouponRepository } from '../coupon-repository'

export class PrismaCouponRepository implements CouponRepository {
  async create(data: Prisma.CouponCreateInput): Promise<Coupon> {
    return prisma.coupon.create({ data })
  }

  async findMany(where: Prisma.CouponWhereInput = {}): Promise<Coupon[]> {
    return prisma.coupon.findMany({ where })
  }

  async findManyPaginated(
    where: Prisma.CouponWhereInput,
    page: number,
    perPage: number,
  ): Promise<{ items: Coupon[]; count: number }> {
    const [count, items] = await prisma.$transaction([
      prisma.coupon.count({ where }),
      prisma.coupon.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ])
    return { items, count }
  }

  async findById(id: string): Promise<Coupon | null> {
    return prisma.coupon.findUnique({ where: { id } })
  }

  async findByCode(code: string): Promise<Coupon | null> {
    return prisma.coupon.findUnique({ where: { code } })
  }

  async update(
    id: string,
    data: Prisma.CouponUpdateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Coupon> {
    const prismaClient = tx || prisma
    return prismaClient.coupon.update({ where: { id }, data })
  }

  async delete(id: string): Promise<void> {
    await prisma.coupon.delete({ where: { id } })
  }
}
