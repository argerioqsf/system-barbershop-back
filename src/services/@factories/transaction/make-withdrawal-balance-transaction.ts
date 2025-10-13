import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { PrismaCashRegisterRepository } from '@/repositories/prisma/prisma-cash-register-repository'
import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'
import { UpdateCashRegisterFinalAmountService } from '@/services/cash-register/update-cash-register-final-amount'
import { IncrementBalanceProfileService } from '@/services/profile/increment-balance'
import { IncrementBalanceUnitService } from '@/services/unit/increment-balance'
import { WithdrawalBalanceTransactionService } from '@/services/transaction/withdrawal-balance-transaction'
import { PrismaSaleItemRepository } from '@/repositories/prisma/prisma-sale-item-repository'
import { PayUserCommissionService } from '@/services/transaction/pay-user-comission'
import { PrismaAppointmentServiceRepository } from '@/repositories/prisma/prisma-appointment-service-repository'
import { PayUserLoansService } from '@/services/loan/pay-user-loans'
import { PrismaLoanRepository } from '@/repositories/prisma/prisma-loan-repository'

export function makeWithdrawalBalanceTransaction() {
  const profilesRepository = new PrismaProfilesRepository()
  const unitRepository = new PrismaUnitRepository()
  const cashRegisterRepository = new PrismaCashRegisterRepository()
  const saleItemRepository = new PrismaSaleItemRepository()
  const appointmentServiceRepository = new PrismaAppointmentServiceRepository()
  const incrementBalanceProfileService = new IncrementBalanceProfileService(
    profilesRepository,
  )
  const payUserCommissionService = new PayUserCommissionService(
    profilesRepository,
    saleItemRepository,
    appointmentServiceRepository,
    incrementBalanceProfileService,
  )
  const loanRepository = new PrismaLoanRepository()
  const incrementUnitService = new IncrementBalanceUnitService(unitRepository)
  const updateCashRegisterFinalAmountService =
    new UpdateCashRegisterFinalAmountService(cashRegisterRepository)
  const payLoansService = new PayUserLoansService(
    loanRepository,
    unitRepository,
  )
  return new WithdrawalBalanceTransactionService(
    new PrismaBarberUsersRepository(),
    cashRegisterRepository,
    saleItemRepository,
    payUserCommissionService,
    payLoansService,
    updateCashRegisterFinalAmountService,
    unitRepository,
    incrementUnitService,
  )
}
