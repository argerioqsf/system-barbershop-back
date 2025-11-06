import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { PrismaCashRegisterRepository } from '@/repositories/prisma/prisma-cash-register-repository'
import { CreateTransactionService } from '@/services/transaction/create-transaction'
import { PrismaTransactionsRepository } from '@/modules/finance/infra/repositories/prisma/prisma-transactions-repository'

export function makeCreateTransaction() {
  return new CreateTransactionService(
    new PrismaTransactionsRepository(),
    new PrismaBarberUsersRepository(),
    new PrismaCashRegisterRepository(),
  )
}
