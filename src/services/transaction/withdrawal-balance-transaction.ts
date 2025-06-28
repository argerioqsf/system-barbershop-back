import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { CashRegisterRepository } from '@/repositories/cash-register-repository'
import { TransactionRepository } from '@/repositories/transaction-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { Transaction } from '@prisma/client'
import { UnitRepository } from '@/repositories/unit-repository'
import { OrganizationRepository } from '@/repositories/organization-repository'
import { IncrementBalanceUnitService } from '../unit/increment-balance'
import { IncrementBalanceProfileService } from '../profile/increment-balance'
import { UserNotFoundError } from '@/services/@errors/user/user-not-found-error'
import { CashRegisterClosedError } from '@/services/@errors/cash-register/cash-register-closed-error'
import { AffectedUserNotFoundError } from '@/services/@errors/transaction/affected-user-not-found-error'
import { NegativeValuesNotAllowedError } from '@/services/@errors/transaction/negative-values-not-allowed-error'
import { InsufficientBalanceError } from '@/services/@errors/transaction/insufficient-balance-error'
import { WithdrawalGreaterThanUnitBalanceError } from '@/services/@errors/transaction/withdrawal-greater-than-unit-balance-error'

interface withdrawalBalanceTransactionRequest {
  userId: string
  affectedUserId?: string
  description: string
  amount: number
  receiptUrl?: string | null
}

interface withdrawalBalanceTransactionResponse {
  transactions: Transaction[]
  surplusValue?: number
}

export class WithdrawalBalanceTransactionService {
  constructor(
    private repository: TransactionRepository,
    private barberUserRepository: BarberUsersRepository,
    private cashRegisterRepository: CashRegisterRepository,
    private profileRepository: ProfilesRepository,
    private unitRepository: UnitRepository,
    private organizationRepository: OrganizationRepository,
  ) {}

  async execute(
    data: withdrawalBalanceTransactionRequest,
  ): Promise<withdrawalBalanceTransactionResponse> {
    const user = await this.barberUserRepository.findById(data.userId)
    if (!user) throw new UserNotFoundError()

    const session = await this.cashRegisterRepository.findOpenByUnit(
      user.unitId,
    )
    if (!session) throw new CashRegisterClosedError()

    let affectedUser
    if (data.affectedUserId) {
      affectedUser = await this.barberUserRepository.findById(
        data.affectedUserId,
      )
      if (!affectedUser) throw new AffectedUserNotFoundError()
    }

    const incrementProfile = new IncrementBalanceProfileService(
      this.profileRepository,
    )
    const incrementUnit = new IncrementBalanceUnitService(
      this.unitRepository,
      this.repository,
    )

    const transactions: Transaction[] = []

    const increment = -data.amount

    if (data.amount < 0) {
      throw new NegativeValuesNotAllowedError()
    }

    const effectiveUser = affectedUser ?? user
    const balanceUnit = effectiveUser.unit?.totalBalance ?? 0
    const balanceUser = effectiveUser.profile?.totalBalance ?? 0

    const surplusValue =
      -increment > balanceUser
        ? balanceUser < 0
          ? increment
          : balanceUser - -increment
        : undefined

    const remainingBalance =
      balanceUser > 0 ? balanceUser - -increment : increment

    if (remainingBalance < 0) {
      if (!effectiveUser.unit?.allowsLoan) {
        throw new InsufficientBalanceError()
      }
      const remainingBalanceRelative = -remainingBalance
      if (remainingBalanceRelative > balanceUnit) {
        throw new WithdrawalGreaterThanUnitBalanceError()
      }
      const transactionProfile = await incrementProfile.execute(
        effectiveUser.id,
        increment,
        undefined,
        true,
      )
      const transactionUnit = await incrementUnit.execute(
        effectiveUser.unitId,
        effectiveUser.id,
        remainingBalance,
        undefined,
        true,
      )
      transactions.push(transactionProfile.transaction)
      transactions.push(transactionUnit.transaction)
    } else {
      const transactionProfile = await incrementProfile.execute(
        effectiveUser.id,
        increment,
      )
      transactions.push(transactionProfile.transaction)
    }

    return { transactions, surplusValue }
  }
}
