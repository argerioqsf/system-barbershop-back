import { Prisma, Coupon } from '@prisma/client'

export interface CouponRepository {
  create(
    data: Prisma.CouponCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Coupon>
  findMany(where?: Prisma.CouponWhereInput): Promise<Coupon[]>
  findManyPaginated(
    where: Prisma.CouponWhereInput,
    page: number,
    perPage: number,
  ): Promise<{ items: Coupon[]; count: number }>
  findById(id: string): Promise<Coupon | null>
  findByCode(code: string): Promise<Coupon | null>
  update(
    id: string,
    data: Prisma.CouponUpdateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Coupon>
  delete(id: string, tx?: Prisma.TransactionClient): Promise<void>
}
