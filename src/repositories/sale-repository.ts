import { Prisma, Sale, SaleItem, Service, User, Coupon } from '@prisma/client'

export type DetailedSale = Sale & {
  items: (SaleItem & { service: Service })[]
  user: User
  coupon: Coupon | null
}

export interface SaleRepository {
  create(data: Prisma.SaleCreateInput): Promise<DetailedSale>
  findMany(where?: Prisma.SaleWhereInput): Promise<DetailedSale[]>
  findById(id: string): Promise<DetailedSale | null>
  findManyByDateRange(start: Date, end: Date): Promise<DetailedSale[]>
  findManyByUser(userId: string): Promise<DetailedSale[]>
}
