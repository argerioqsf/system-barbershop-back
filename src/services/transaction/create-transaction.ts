import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { CashRegisterRepository } from '@/repositories/cash-register-repository'
import { TransactionRepository } from '@/repositories/transaction-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { Transaction, TransactionType } from '@prisma/client'
import { UnitRepository } from '@/repositories/unit-repository'
import { OrganizationRepository } from '@/repositories/organization-repository'
import { IncrementBalanceUnitService } from '../unit/increment-balance'
import { IncrementBalanceProfileService } from '../profile/increment-balance'
import { IncrementBalanceOrganizationService } from '../organization/increment-balance'

interface CreateTransactionRequest {
  userId: string
  affectedUserId?: string
  type: TransactionType
  description: string
  amount: number
  receiptUrl?: string | null
}

interface CreateTransactionResponse {
  transaction: Transaction
  surplusValue?: number
}

export class CreateTransactionService {
  constructor(
    private repository: TransactionRepository,
    private barberUserRepository: BarberUsersRepository,
    private cashRegisterRepository: CashRegisterRepository,
    private profileRepository: ProfilesRepository,
    private unitRepository: UnitRepository,
    private organizationRepository: OrganizationRepository,
  ) {}

  async execute(
    data: CreateTransactionRequest,
  ): Promise<CreateTransactionResponse> {
    const user = await this.barberUserRepository.findById(data.userId)
    if (!user) throw new Error('User not found')

    const session = await this.cashRegisterRepository.findOpenByUnit(
      user.unitId,
    )
    if (!session) throw new Error('Cash register closed')

    let affectedUser
    if (data.affectedUserId) {
      affectedUser = await this.barberUserRepository.findById(
        data.affectedUserId,
      )
      if (!affectedUser) throw new Error('Affected user not found')
    }

    const incrementProfile = new IncrementBalanceProfileService(
      this.profileRepository,
      this.repository,
    )
    const incrementUnit = new IncrementBalanceUnitService(
      this.unitRepository,
      this.repository,
    )
    const incrementOrg = new IncrementBalanceOrganizationService(
      this.organizationRepository,
      this.repository,
    )

    const transaction = await this.repository.create({
      user: { connect: { id: user.id } },
      unit: { connect: { id: user.unitId } },
      ...(affectedUser && {
        affectedUser: { connect: { id: affectedUser.id } },
      }),
      type: data.type,
      description: data.description,
      amount: data.amount,
      receiptUrl: data.receiptUrl,
      session: { connect: { id: session.id } },
    })
    let surplusValue: number | undefined
    try {
      const increment = data.type === 'ADDITION' ? data.amount : -data.amount
      if (data.type === 'WITHDRAWAL' && data.amount < 0) {
        throw new Error('Negative values ​​cannot be passed on withdrawals')
      }
      if (data.type === 'ADDITION' && data.amount < 0) {
        throw new Error('Negative values ​​cannot be passed on additions')
      }

      const effectiveUser = affectedUser ?? user
      const balanceUnit = effectiveUser.unit?.totalBalance ?? 0
      const balanceUser = effectiveUser.profile?.totalBalance ?? 0

      if (increment < 0) {
        surplusValue =
          -increment > balanceUser
            ? balanceUser < 0
              ? increment
              : balanceUser - -increment
            : undefined

        const remainingBalance =
          balanceUser > 0 ? balanceUser - -increment : increment

        if (remainingBalance < 0) {
          if (!effectiveUser.unit?.allowsLoan) {
            throw new Error('Insufficient balance for withdrawal')
          }
          const remainingBalanceRelative = -remainingBalance
          if (remainingBalanceRelative > balanceUnit) {
            throw new Error('Withdrawal amount greater than unit balance')
          }
          await incrementProfile.execute(
            effectiveUser.id,
            session.id,
            increment,
          )
          await incrementUnit.execute(
            effectiveUser.unitId,
            user.id,
            session.id,
            remainingBalance,
          )
          await incrementOrg.execute(
            effectiveUser.organizationId,
            user.id,
            effectiveUser.unitId,
            session.id,
            remainingBalance,
          )
        } else {
          await incrementProfile.execute(
            effectiveUser.id,
            session.id,
            increment,
          )
        }
      } else {
        if (affectedUser) {
          if (balanceUser < 0) {
            const remainingBalance = balanceUser - increment
            const valueForPay = remainingBalance < 0 ? increment : balanceUser
            await incrementUnit.execute(
              affectedUser.unitId,
              user.id,
              session.id,
              valueForPay,
            )
            await incrementOrg.execute(
              affectedUser.organizationId,
              user.id,
              affectedUser.unitId,
              session.id,
              valueForPay,
            )
            await incrementProfile.execute(
              affectedUser.id,
              session.id,
              valueForPay,
            )
          } else {
            await incrementUnit.execute(
              affectedUser.unitId,
              user.id,
              session.id,
              increment,
            )
            await incrementOrg.execute(
              affectedUser.organizationId,
              user.id,
              affectedUser.unitId,
              session.id,
              increment,
            )
            await incrementProfile.execute(
              affectedUser.id,
              session.id,
              increment,
            )
          }
        } else {
          await incrementUnit.execute(
            user.unitId,
            user.id,
            session.id,
            increment,
          )
          await incrementOrg.execute(
            user.organizationId,
            user.id,
            user.unitId,
            session.id,
            increment,
          )
        }
      }
    } catch (error) {
      await this.repository.delete(transaction.id)
      throw error
    }
    return { transaction, surplusValue }
  }
}
