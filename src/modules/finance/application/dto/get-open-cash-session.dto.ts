export interface GetOpenCashSessionDTO {
  unitId: string
}

export interface OpenCashSessionPresenter {
  id: string
  unitId: string
  openedById: string
  openedAt: Date
  closedAt: Date | null
  initialAmount: number
  finalAmount: number
  transactions: Array<{
    id: string
    amount: number
    reason: string
    description: string | null
    createdAt: Date
    type: string
    userId: string
    affectedUserId: string | null
    saleId: string | null
    saleItemId: string | null
    sessionId: string | null
    unitId: string | null
    loanId: string | null
    appointmentServiceId: string | null
    receiptUrl: string | null
    isLoan: boolean
  }>
  commissionCheckpoints?: Array<{
    profileId: string
    totalBalance: number
  }>
}

export interface GetOpenCashSessionOutput {
  session: OpenCashSessionPresenter | null
}
