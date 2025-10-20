import { UserToken } from '@/http/controllers/authenticate-controller'
import { CashRegisterRepository } from '@/repositories/cash-register-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { UserNotFoundError } from '@/services/@errors/user/user-not-found-error'
import { CashRegisterAlreadyOpenError } from '@/services/@errors/cash-register/cash-register-already-open-error'
import {
  CashRegisterSession,
  ReasonTransaction,
  RoleName,
} from '@prisma/client'
import { IncrementBalanceUnitService } from '../unit/increment-balance'

interface OpenSessionRequest {
  user: UserToken
  initialAmount: number
}

interface OpenSessionResponse {
  session: CashRegisterSession
}

export class OpenSessionService {
  constructor(
    private repository: CashRegisterRepository,
    private profilesRepository: ProfilesRepository,
    private incrementBalanceUnit: IncrementBalanceUnitService,
  ) {}

  async execute({
    user,
    initialAmount,
  }: OpenSessionRequest): Promise<OpenSessionResponse> {
    if (!user) throw new UserNotFoundError()
    const existing = await this.repository.findOpenByUnit(user.unitId)
    if (existing) throw new CashRegisterAlreadyOpenError()

    const profiles = await this.profilesRepository.findMany({
      user: {
        unitId: user.unitId,
      },
      role: { is: { name: { in: [RoleName.BARBER, RoleName.ATTENDANT] } } },
    })

    const commissionCheckpointsData = profiles.map((profile) => ({
      profileId: profile.id,
      totalBalance: profile.totalBalance,
    }))

    const session = await this.repository.create({
      user: { connect: { id: user.sub } },
      unit: { connect: { id: user.unitId } },
      initialAmount,
      finalAmount: initialAmount,
      commissionCheckpoints: {
        create: commissionCheckpointsData,
      },
    })

    if (initialAmount > 0) {
      await this.incrementBalanceUnit.execute(
        user.unitId,
        user.sub,
        initialAmount,
        undefined,
        false,
        undefined,
        'Initial amount',
        { reason: ReasonTransaction.CASH_OPENING },
      )
    }

    return { session }
  }
}
