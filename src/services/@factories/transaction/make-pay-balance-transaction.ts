import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { PrismaCashRegisterRepository } from '@/repositories/prisma/prisma-cash-register-repository'
import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { PrismaSaleItemRepository } from '@/repositories/prisma/prisma-sale-item-repository'
import { PrismaAppointmentServiceRepository } from '@/repositories/prisma/prisma-appointment-service-repository'
import { PrismaLoanRepository } from '@/repositories/prisma/prisma-loan-repository'
import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'
import { PayBalanceTransactionService } from '@/services/transaction/pay-balance-transaction'
import { PayUserCommissionService } from '@/services/transaction/pay-user-comission'
import { IncrementBalanceProfileService } from '@/services/profile/increment-balance'
import { PayUserLoansService } from '@/services/loan/pay-user-loans'
import { UpdateCashRegisterFinalAmountService } from '@/services/cash-register/update-cash-register-final-amount'

export function makePayBalanceTransaction() {
  const profileRepository = new PrismaProfilesRepository()
  const saleItemRepository = new PrismaSaleItemRepository()
  const appointmentServiceRepository = new PrismaAppointmentServiceRepository()
  const incrementBalanceProfileService = new IncrementBalanceProfileService(
    profileRepository,
  )
  const payUserCommissionService = new PayUserCommissionService(
    profileRepository,
    saleItemRepository,
    appointmentServiceRepository,
    incrementBalanceProfileService,
  )

  const loanRepository = new PrismaLoanRepository()
  const unitRepository = new PrismaUnitRepository()
  const payLoansService = new PayUserLoansService(
    loanRepository,
    unitRepository,
  )

  const cashRegisterRepository = new PrismaCashRegisterRepository()
  const updateCashRegisterFinalAmountService =
    new UpdateCashRegisterFinalAmountService(cashRegisterRepository)

  return new PayBalanceTransactionService(
    new PrismaBarberUsersRepository(),
    cashRegisterRepository,
    saleItemRepository,
    payUserCommissionService,
    payLoansService,
    updateCashRegisterFinalAmountService,
  )
}
