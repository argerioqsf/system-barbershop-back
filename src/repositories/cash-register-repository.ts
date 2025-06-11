import { Prisma, CashRegisterSession, User } from "@prisma/client";

export type DetailedCashSession = CashRegisterSession & { user: User }

export interface CashRegisterRepository {
  create(
    data: Prisma.CashRegisterSessionCreateInput,
  ): Promise<CashRegisterSession>;
  close(
    id: string,
    data: Prisma.CashRegisterSessionUpdateInput,
  ): Promise<CashRegisterSession>;
  findMany(): Promise<DetailedCashSession[]>;
  findManyByUnit(unitId: string): Promise<DetailedCashSession[]>;
  findOpenByUser(userId: string): Promise<CashRegisterSession | null>;
}
