import { PrismaTransactionRepository } from '@/repositories/prisma/prisma-transaction-repository'
import { CreateTransactionService } from '@/services/transaction/create-transaction'

export function makeCreateTransaction() {
  return new CreateTransactionService(new PrismaTransactionRepository())
}
