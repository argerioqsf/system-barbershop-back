import { Prisma } from '@prisma/client'

export type TransactionClient = Prisma.TransactionClient

export interface TransactionRunner {
  run<T>(handler: (tx: TransactionClient) => Promise<T>): Promise<T>
}
