import { Prisma, Coupon } from '@prisma/client'

export interface CouponRepository {
  create(data: Prisma.CouponCreateInput): Promise<Coupon>
  findMany(where?: Prisma.CouponWhereInput): Promise<Coupon[]>
  findById(id: string): Promise<Coupon | null>
  findByCode(code: string): Promise<Coupon | null>
  update(
    id: string,
    data: Prisma.CouponUpdateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Coupon>
  delete(id: string): Promise<void>
}
