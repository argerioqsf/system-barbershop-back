import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { PrismaCashRegisterRepository } from '@/repositories/prisma/prisma-cash-register-repository'
import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'
import { AddBalanceTransactionService } from '@/services/transaction/add-balance-transaction'
import { IncrementBalanceProfileService } from '@/services/profile/increment-balance'
import { IncrementBalanceUnitService } from '@/services/unit/increment-balance'
import { UpdateCashRegisterFinalAmountService } from '@/services/cash-register/update-cash-register-final-amount'

export function makeAddBalanceTransaction() {
  const profilesRepository = new PrismaProfilesRepository()
  const unitRepository = new PrismaUnitRepository()
  const cashRegisterRepository = new PrismaCashRegisterRepository()
  const barberUserRepository = new PrismaBarberUsersRepository()

  const incrementProfileService = new IncrementBalanceProfileService(
    profilesRepository,
  )
  const incrementUnitService = new IncrementBalanceUnitService(unitRepository)
  const updateCashRegisterFinalAmountService =
    new UpdateCashRegisterFinalAmountService(cashRegisterRepository)

  return new AddBalanceTransactionService(
    barberUserRepository,
    cashRegisterRepository,
    incrementProfileService,
    incrementUnitService,
    updateCashRegisterFinalAmountService,
  )
}
