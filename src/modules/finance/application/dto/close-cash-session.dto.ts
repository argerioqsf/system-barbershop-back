export interface CloseCashSessionDTO {
  unitId: string
}

export interface CloseCashSessionPresenter {
  id: string
  unitId: string
  openedById: string
  openedAt: Date
  closedAt: Date | null
  initialAmount: number
  finalAmount: number
  commissionCheckpoints?: Array<{
    profileId: string
    totalBalance: number
  }>
}

export interface CloseCashSessionOutput {
  session: CloseCashSessionPresenter
}
