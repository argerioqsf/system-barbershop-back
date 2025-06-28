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

interface PayBalanceTransactionRequest {
  userId: string
  affectedUserId: string
  description: string
  amount: number
  receiptUrl?: string | null
}

interface PayBalanceTransactionResponse {
  transactions: Transaction[]
}

export class PayBalanceTransactionService {
  constructor(
    private repository: TransactionRepository,
    private barberUserRepository: BarberUsersRepository,
    private cashRegisterRepository: CashRegisterRepository,
    private profileRepository: ProfilesRepository,
    private unitRepository: UnitRepository,
    private organizationRepository: OrganizationRepository,
  ) {}

  async execute(
    data: PayBalanceTransactionRequest,
  ): Promise<PayBalanceTransactionResponse> {
    const user = await this.barberUserRepository.findById(data.userId)
    if (!user) throw new UserNotFoundError()

    const session = await this.cashRegisterRepository.findOpenByUnit(
      user.unitId,
    )
    if (!session) throw new CashRegisterClosedError()

    const affectedUser = await this.barberUserRepository.findById(
      data.affectedUserId,
    )
    if (!affectedUser) throw new AffectedUserNotFoundError()

    if (data.amount < 0) {
      throw new NegativeValuesNotAllowedError()
    }

    const balanceUser = affectedUser.profile?.totalBalance ?? 0
    if (data.amount > balanceUser) {
      throw new InsufficientBalanceError()
    }

    const decrementProfile = new IncrementBalanceProfileService(
      this.profileRepository,
      this.repository,
    )
    const decrementUnit = new IncrementBalanceUnitService(
      this.unitRepository,
      this.repository,
    )

    const transactions: Transaction[] = []
    const increment = -data.amount

    const transactionProfile = await decrementProfile.execute(
      affectedUser.id,
      increment,
    )
    transactions.push(transactionProfile.transaction)

    const transactionUnit = await decrementUnit.execute(
      affectedUser.unitId,
      affectedUser.id,
      increment,
    )
    transactions.push(transactionUnit.transaction)

    return { transactions }
  }
}
