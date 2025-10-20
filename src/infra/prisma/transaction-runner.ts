import { prisma } from '@/lib/prisma'
import { Prisma, PrismaClient } from '@prisma/client'

import {
  TransactionClient,
  TransactionRunner,
} from '@/core/application/ports/transaction-runner'

export class PrismaTransactionRunner implements TransactionRunner {
  constructor(private readonly client: PrismaClient = prisma) {}

  async run<T>(handler: (tx: TransactionClient) => Promise<T>): Promise<T> {
    return this.client.$transaction((tx) => handler(tx))
  }
}

/**
 * Default runner that delegates to the shared Prisma client.
 * Use this for legacy flows that still rely on direct service instantiation.
 */
export const defaultTransactionRunner = new PrismaTransactionRunner()

export type PrismaTransaction = Prisma.TransactionClient
