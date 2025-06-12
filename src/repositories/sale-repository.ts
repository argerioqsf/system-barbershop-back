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

export type DetailedSaleItem = SaleItem & {
  service: Service
  barber: (User & { profile: Profile | null }) | null
  coupon: Coupon | null
  price: number
}

export type DetailedSale = Sale & {
  items: DetailedSaleItem[]
  user: User & { profile: Profile | null }
  coupon: Coupon | null
  session: CashRegisterSession | null
  transaction: Transaction
}

export interface SaleRepository {
  create(data: Prisma.SaleCreateInput): Promise<DetailedSale>
  findMany(where?: Prisma.SaleWhereInput): Promise<DetailedSale[]>
  findById(id: string): Promise<DetailedSale | null>
  findManyByDateRange(start: Date, end: Date): Promise<DetailedSale[]>
  findManyByUser(userId: string): Promise<DetailedSale[]>
  findManyByBarber(barberId: string): Promise<DetailedSale[]>
  findManyBySession(sessionId: string): Promise<DetailedSale[]>
}
