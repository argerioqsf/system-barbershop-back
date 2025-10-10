import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { PrismaCashRegisterRepository } from '@/repositories/prisma/prisma-cash-register-repository'
import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'
import { UpdateCashRegisterFinalAmountService } from '@/services/cash-register/update-cash-register-final-amount'
import { IncrementBalanceProfileService } from '@/services/profile/increment-balance'
import { IncrementBalanceUnitService } from '@/services/unit/increment-balance'
import { WithdrawalBalanceTransactionService } from '@/services/transaction/withdrawal-balance-transaction'

export function makeWithdrawalBalanceTransaction() {
  const profilesRepository = new PrismaProfilesRepository()
  const unitRepository = new PrismaUnitRepository()
  const cashRegisterRepository = new PrismaCashRegisterRepository()

  const incrementProfileService = new IncrementBalanceProfileService(
    profilesRepository,
  )
  const incrementUnitService = new IncrementBalanceUnitService(unitRepository)
  const updateCashRegisterFinalAmountService =
    new UpdateCashRegisterFinalAmountService(cashRegisterRepository)

  return new WithdrawalBalanceTransactionService(
    new PrismaBarberUsersRepository(),
    cashRegisterRepository,
    profilesRepository,
    unitRepository,
    incrementProfileService,
    incrementUnitService,
    updateCashRegisterFinalAmountService,
  )
}
