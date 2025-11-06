import { Money } from '@/core/domain/value-objects/money'

export interface OpenCashSessionDTO {
  actorId: string
  unitId: string
  initialAmount: Money
}

export interface OpenCashSessionOutput {
  session: {
    id: string
    unitId: string
    openedByUserId: string
    openedAt: Date
    closedAt: Date | null
    initialAmount: number
    finalAmount: number
    commissionCheckpoints?: Array<{
      profileId: string
      totalBalance: number
    }>
  }
}
