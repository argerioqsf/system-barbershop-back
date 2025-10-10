import {
  Prisma,
  CashRegisterSession,
  User,
  Sale,
  SaleItem,
  Service,
  Profile,
  Coupon,
  Transaction,
  CheckpointCommissionProfile,
} from '@prisma/client'

export type DetailedCashSession = CashRegisterSession & {
  user: User
  sales: Sale[]
  transactions: Transaction[]
}

export type CompleteCashSession = CashRegisterSession & {
  user: User
  sales: Array<
    Sale & {
      items: Array<
        SaleItem & {
          service: Service | null
        }
      >
      user: User & { profile: Profile | null }
      coupon: Coupon | null
    }
  >
  transactions: Transaction[]
}

export type ResponseFindOpenByUnit =
  | (CashRegisterSession & {
      transactions: Transaction[]
      commissionCheckpoints: CheckpointCommissionProfile[]
    })
  | null

export interface CashRegisterRepository {
  create(
    data: Prisma.CashRegisterSessionCreateInput,
  ): Promise<CashRegisterSession>
  close(
    id: string,
    data: Prisma.CashRegisterSessionUpdateInput,
  ): Promise<CashRegisterSession>
  findMany(
    where?: Prisma.CashRegisterSessionWhereInput,
  ): Promise<DetailedCashSession[]>
  findManyByUnit(unitId: string): Promise<DetailedCashSession[]>
  findOpenByUser(userId: string): Promise<CashRegisterSession | null>
  findOpenByUnit(unitId: string): Promise<ResponseFindOpenByUnit>
  findById(id: string): Promise<CompleteCashSession | null>
  incrementFinalAmount(
    sessionId: string,
    amount: number,
    tx?: Prisma.TransactionClient,
  ): Promise<CashRegisterSession>
}
