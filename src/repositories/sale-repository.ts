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
  Appointment,
  Discount,
  Unit,
  PaymentStatus,
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
  discounts: Discount[]
  porcentagemBarbeiro: number | null
}

export type DetailedSale = Sale & {
  items: DetailedSaleItem[]
  user: User & { profile: Profile | null }
  client: User & { profile: Profile | null }
  coupon: Coupon | null
  session: CashRegisterSession | null
  transactions: Transaction[]
  unit: Unit
}

export interface SaleRepository {
  create(data: Prisma.SaleCreateInput): Promise<DetailedSale>
  findMany(where?: Prisma.SaleWhereInput): Promise<DetailedSale[]>
  findManyPaginated(
    where: Prisma.SaleWhereInput,
    page: number,
    perPage: number,
  ): Promise<{ items: DetailedSale[]; count: number }>
  findById(id: string): Promise<DetailedSale | null>
  update(
    id: string,
    data: Prisma.SaleUpdateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<DetailedSale>
  updateStatus(id: string, status: PaymentStatus): Promise<DetailedSale>
  findManyByDateRange(start: Date, end: Date): Promise<DetailedSale[]>
  findManyByUser(userId: string): Promise<DetailedSale[]>
  findManyByBarber(
    barberId: string,
    where?: Prisma.SaleWhereInput,
  ): Promise<DetailedSale[]>
  findManyBySession(sessionId: string): Promise<DetailedSale[]>
}
