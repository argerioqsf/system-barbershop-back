import {
  Prisma,
  Sale,
  SaleItem,
  Service,
  Product,
  Plan,
  User,
  Coupon,
  Profile,
  CashRegisterSession,
  Transaction,
  DiscountType,
  Appointment,
} from '@prisma/client'
import { DetailedAppointment } from './appointment-repository'

export type DetailedSaleItem = SaleItem & {
  service: Service | null
  product: Product | null
  plan: Plan | null
  barber: (User & { profile: Profile | null }) | null
  coupon: Coupon | null
  appointment:
    | (Appointment & { services?: DetailedAppointment['services'] })
    | null
  price: number
  discount: number | null
  discountType: DiscountType | null
  porcentagemBarbeiro: number | null
}

export type DetailedSale = Sale & {
  items: DetailedSaleItem[]
  user: User & { profile: Profile | null }
  client: User & { profile: Profile | null }
  coupon: Coupon | null
  session: CashRegisterSession | null
  transactions: Transaction[]
}

export interface SaleRepository {
  create(data: Prisma.SaleCreateInput): Promise<DetailedSale>
  findMany(where?: Prisma.SaleWhereInput): Promise<DetailedSale[]>
  findById(id: string): Promise<DetailedSale | null>
  update(id: string, data: Prisma.SaleUpdateInput): Promise<DetailedSale>
  findManyByDateRange(start: Date, end: Date): Promise<DetailedSale[]>
  findManyByUser(userId: string): Promise<DetailedSale[]>
  findManyByBarber(
    barberId: string,
    where?: Prisma.SaleWhereInput,
  ): Promise<DetailedSale[]>
  findManyBySession(sessionId: string): Promise<DetailedSale[]>
}
