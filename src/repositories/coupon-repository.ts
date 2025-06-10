import { Prisma, Coupon } from '@prisma/client'

export interface CouponRepository {
  create(data: Prisma.CouponCreateInput): Promise<Coupon>
  findMany(): Promise<Coupon[]>
  findById(id: string): Promise<Coupon | null>
  findByCode(code: string): Promise<Coupon | null>
  delete(id: string): Promise<void>
}
