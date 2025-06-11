import {
  Prisma,
  Sale,
  SaleItem,
  Service,
  User,
  Coupon,
  Profile,
  CashRegisterSession,
  Transaction,
} from '@prisma/client'

export type DetailedSale = Sale & {
  items: (SaleItem & {
    service: Service
    barber: User | null
    coupon: Coupon | null
  })[]
  user: User & { profile: Profile | null }
  coupon: Coupon | null
  session: CashRegisterSession | null
  transaction: Transaction | null
}

export interface SaleRepository {
  create(data: Prisma.SaleCreateInput): Promise<DetailedSale>
  findMany(where?: Prisma.SaleWhereInput): Promise<DetailedSale[]>
  findById(id: string): Promise<DetailedSale | null>
  findManyByDateRange(start: Date, end: Date): Promise<DetailedSale[]>
  findManyByUser(userId: string): Promise<DetailedSale[]>
  findManyBySession(sessionId: string): Promise<DetailedSale[]>
  update(id: string, data: Prisma.SaleUpdateInput): Promise<void>
}
