import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { PrismaCashRegisterRepository } from '@/repositories/prisma/prisma-cash-register-repository'
import { PrismaLoanRepository } from '@/repositories/prisma/prisma-loan-repository'
import { CreateLoanService } from '@/services/loan/create-loan'

export function makeCreateLoan() {
  return new CreateLoanService(
    new PrismaLoanRepository(),
    new PrismaBarberUsersRepository(),
    new PrismaCashRegisterRepository(),
  )
}
