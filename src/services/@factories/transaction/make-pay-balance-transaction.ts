import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { PrismaCashRegisterRepository } from '@/repositories/prisma/prisma-cash-register-repository'
import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { PrismaSaleItemRepository } from '@/repositories/prisma/prisma-sale-item-repository'
import { PrismaAppointmentServiceRepository } from '@/repositories/prisma/prisma-appointment-service-repository'
import { PrismaLoanRepository } from '@/repositories/prisma/prisma-loan-repository'
import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'
import { PayBalanceTransactionService } from '@/services/transaction/pay-balance-transaction'

export function makePayBalanceTransaction() {
  return new PayBalanceTransactionService(
    new PrismaBarberUsersRepository(),
    new PrismaCashRegisterRepository(),
    new PrismaProfilesRepository(),
    new PrismaSaleItemRepository(),
    new PrismaAppointmentServiceRepository(),
    new PrismaUnitRepository(),
    new PrismaLoanRepository(),
  )
}
