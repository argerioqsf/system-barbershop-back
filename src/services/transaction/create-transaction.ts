import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { CashRegisterRepository } from '@/repositories/cash-register-repository'
import { TransactionRepository } from '@/repositories/transaction-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { Transaction, TransactionType } from '@prisma/client'
import { UnitRepository } from '@/repositories/unit-repository'
import { OrganizationRepository } from '@/repositories/organization-repository'

interface CreateTransactionRequest {
  userId: string
  affectedUserId?: string
  type: TransactionType
  description: string
  amount: number
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

    const session = await this.cashRegisterRepository.findOpenByUnit(user.unitId)
    if (!session) throw new Error('Cash register closed')

    let affectedUser
    if (data.affectedUserId) {
      affectedUser = await this.barberUserRepository.findById(data.affectedUserId)
      if (!affectedUser) throw new Error('Affected user not found')
    }

    const transaction = await this.repository.create({
      user: { connect: { id: user.id } },
      unit: { connect: { id: user.unitId } },
      ...(affectedUser && { affectedUser: { connect: { id: affectedUser.id } } }),
      type: data.type,
      description: data.description,
      amount: data.amount,
      session: { connect: { id: session.id } },
    })
    let surplusValue: number | undefined
    const increment = data.type === 'ADDITION' ? data.amount : -data.amount
    if (data.type === 'WITHDRAWAL' && data.amount < 0) {
      throw new Error('Negative values ​​cannot be passed on withdrawals')
    }
    if (data.type === 'ADDITION' && data.amount < 0) {
      throw new Error('Negative values ​​cannot be passed on additions')
    }
    if (increment < 0) {
      if (affectedUser) {
        const balanceUnit = affectedUser.unit?.totalBalance ?? 0
        const balanceUser = affectedUser.profile?.totalBalance ?? 0
        surplusValue =
          -increment > balanceUser
            ? balanceUser < 0
              ? increment
              : balanceUser - -increment
            : undefined
        const remainingBalance =
          balanceUser > 0 ? balanceUser - -increment : increment
        if (remainingBalance < 0) {
          const remainingBalanceRelative = -remainingBalance
          if (
            remainingBalanceRelative > balanceUnit &&
            !affectedUser.unit?.allowsLoan
          ) {
            throw new Error('Withdrawal amount greater than unit balance')
          }
          await this.profileRepository.incrementBalance(affectedUser.id, increment)
          await this.unitRepository.incrementBalance(
            affectedUser.unitId,
            remainingBalance,
          )
          await this.organizationRepository.incrementBalance(
            affectedUser.organizationId,
            remainingBalance,
          )
        } else {
          await this.profileRepository.incrementBalance(affectedUser.id, increment)
        }
      } else {
        const balanceUnit = user.unit?.totalBalance ?? 0
        if (-increment > balanceUnit && !user.unit?.allowsLoan) {
          throw new Error('Withdrawal amount greater than unit balance')
        }
        await this.unitRepository.incrementBalance(user.unitId, increment)
        await this.organizationRepository.incrementBalance(
          user.organizationId,
          increment,
        )
      }
    } else {
      if (affectedUser) {
        await this.profileRepository.incrementBalance(affectedUser.id, increment)
      }
      await this.unitRepository.incrementBalance(user.unitId, increment)
      await this.organizationRepository.incrementBalance(
        user.organizationId,
        increment,
      )
    }
    return { transaction, surplusValue }
  }
}
