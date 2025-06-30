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

interface AddBalanceTransactionRequest {
  userId: string
  affectedUserId?: string
  description: string
  amount: number
  receiptUrl?: string | null
}

interface AddBalanceTransactionResponse {
  transactions: Transaction[]
  surplusValue?: number
}

export class AddBalanceTransactionService {
  constructor(
    private repository: TransactionRepository,
    private barberUserRepository: BarberUsersRepository,
    private cashRegisterRepository: CashRegisterRepository,
    private profileRepository: ProfilesRepository,
    private unitRepository: UnitRepository,
    private organizationRepository: OrganizationRepository,
  ) {}

  async execute(
    data: AddBalanceTransactionRequest,
  ): Promise<AddBalanceTransactionResponse> {
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
    let surplusValue: number | undefined

    const increment = data.amount

    if (increment < 0) {
      throw new NegativeValuesNotAllowedError()
    }

    const effectiveUser = affectedUser ?? user
    const balanceUser = effectiveUser.profile?.totalBalance ?? 0

    if (affectedUser) {
      const remainingBalance = balanceUser - increment
      const valueForPay = remainingBalance < 0 ? increment : balanceUser
      const amountToPay = balanceUser < 0 ? valueForPay : increment
      if (balanceUser < 0) {
        const transactionUnit = await incrementUnit.execute(
          affectedUser.unitId,
          affectedUser.id,
          amountToPay,
          undefined,
          true,
        )
        const transactionProfile = await incrementProfile.execute(
          affectedUser.id,
          amountToPay,
          undefined,
          true,
          undefined,
          undefined,
          undefined,
        )
        transactions.push(transactionUnit.transaction)
        transactions.push(transactionProfile.transaction)
      } else {
        const transactionProfile = await incrementProfile.execute(
          affectedUser.id,
          amountToPay,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
        )
        transactions.push(transactionProfile.transaction)
      }
    } else {
      const transactionUnit = await incrementUnit.execute(
        user.unitId,
        user.id,
        increment,
        undefined,
        false,
      )
      transactions.push(transactionUnit.transaction)
    }
    return { transactions, surplusValue }
  }
}
