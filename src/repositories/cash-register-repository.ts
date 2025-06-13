import {
  Prisma,
  CashRegisterSession,
  User,
  Sale,
  Transaction,
} from '@prisma/client'

export type DetailedCashSession = CashRegisterSession & {
  user: User
  sales: Sale[]
}

export type CompleteCashSession = CashRegisterSession & {
  user: User
  sales: Sale[]
  transactions: Transaction[]
}

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
  findOpenByUnit(unitId: string): Promise<CashRegisterSession | null>
  findById(id: string): Promise<CompleteCashSession | null>
}
