import { Prisma, Transaction } from "@prisma/client";

export interface TransactionRepository {
  create(data: Prisma.TransactionCreateInput): Promise<Transaction>;
  findManyByUser(userId: string): Promise<Transaction[]>;
  findMany(): Promise<Transaction[]>;
  findManyByUnit(unitId: string): Promise<Transaction[]>;
}
