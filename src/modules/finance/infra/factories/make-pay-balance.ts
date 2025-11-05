import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { PrismaCashRegisterRepositoryAdapter } from '@/modules/finance/infra/repositories/prisma/prisma-cash-register-repository'
import { PrismaSaleItemRepository } from '@/repositories/prisma/prisma-sale-item-repository'
import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { PrismaAppointmentServiceRepository } from '@/repositories/prisma/prisma-appointment-service-repository'
import { PayBalanceUseCase } from '@/modules/finance/application/use-cases/pay-balance'
import { UpdateCashFinalAmountUseCase } from '@/modules/finance/application/use-cases/update-cash-final-amount'
import { IncrementBalanceProfileService } from '@/services/profile/increment-balance'
import { defaultTransactionRunner } from '@/infra/prisma/transaction-runner'
import { makePayUserLoansUseCase } from './make-pay-user-loans'
import { PayCommissionUseCase } from '@/modules/finance/application/use-cases/pay-commission'
import { CommissionCalculator } from '@/modules/finance/domain/services/commission-calculator'

export function makePayBalanceUseCase() {
  const barberUsersRepository = new PrismaBarberUsersRepository()
  const cashRegisterRepository = new PrismaCashRegisterRepositoryAdapter()
  const saleItemRepository = new PrismaSaleItemRepository()
  const profilesRepository = new PrismaProfilesRepository()
  const appointmentServiceRepository = new PrismaAppointmentServiceRepository()

  const incrementBalanceProfileService = new IncrementBalanceProfileService(
    profilesRepository,
  )

  const commissionCalculator = new CommissionCalculator()

  const payCommissionUseCase = new PayCommissionUseCase(
    saleItemRepository,
    appointmentServiceRepository,
    incrementBalanceProfileService,
    commissionCalculator,
  )

  const payUserLoansUseCase = makePayUserLoansUseCase()

  const updateCashRegisterFinalAmountUseCase = new UpdateCashFinalAmountUseCase(
    cashRegisterRepository,
  )

  return new PayBalanceUseCase(
    barberUsersRepository,
    cashRegisterRepository,
    payCommissionUseCase,
    payUserLoansUseCase,
    updateCashRegisterFinalAmountUseCase,
    defaultTransactionRunner,
  )
}
