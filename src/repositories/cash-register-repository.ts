import { Prisma, CashRegisterSession } from '@prisma/client'

export interface CashRegisterRepository {
  create(data: Prisma.CashRegisterSessionCreateInput): Promise<CashRegisterSession>
  close(id: string, data: Prisma.CashRegisterSessionUpdateInput): Promise<CashRegisterSession>
  findManyByUnit(unitId: string): Promise<CashRegisterSession[]>
  findOpenByUser(userId: string): Promise<CashRegisterSession | null>
}
