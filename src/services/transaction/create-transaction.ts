import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { CashRegisterRepository } from '@/repositories/cash-register-repository'
import { TransactionRepository } from '@/repositories/transaction-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { Transaction, TransactionType } from '@prisma/client'
import { UnitRepository } from '@/repositories/unit-repository'
import { OrganizationRepository } from '@/repositories/organization-repository'

interface CreateTransactionRequest {
  userId: string
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
    const session = await this.cashRegisterRepository.findOpenByUnit(
      user?.unitId as string,
    )
    if (!session) throw new Error('Cash register closed')
    const transaction = await this.repository.create({
      user: { connect: { id: user.id } },
      unit: { connect: { id: user.unitId } },
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
      const balanceUnit = user.unit?.totalBalance ?? 0
      const balanceUser = user.profile?.totalBalance ?? 0
      surplusValue =
        -1 * increment > balanceUser
          ? balanceUser < 0
            ? increment
            : balanceUser - increment * -1
          : undefined
      const incrementRelative = -1 * increment
      const remainingBalance =
        balanceUser > 0 ? balanceUser - incrementRelative : increment
      if (remainingBalance < 0) {
        const remainingBalanceRelative = remainingBalance * -1
        if (remainingBalanceRelative > balanceUnit) {
          throw new Error('Withdrawal amount greater than unit balance')
        }
        await this.profileRepository.incrementBalance(user.id, increment)
        await this.unitRepository.incrementBalance(
          user.unitId,
          remainingBalance,
        )
        await this.organizationRepository.incrementBalance(
          user.organizationId,
          remainingBalance,
        )
      } else {
        await this.profileRepository.incrementBalance(user.id, increment)
      }
    } else {
      await this.unitRepository.incrementBalance(user.unitId, increment)
      await this.organizationRepository.incrementBalance(
        user.organizationId,
        increment,
      )
    }
    return { transaction, surplusValue }
  }
}
