import { LoanWithTransactions } from '@/repositories/loan-repository'
import { ReturnFindManyPendingCommission } from '@/repositories/sale-item-repository'
import { Transaction } from '@prisma/client'

// This type was previously in a legacy util file.
export interface PaymentItem {
  saleId: string
  saleItemId: string
  appointmentServiceId?: string
  amount: number
  item: ReturnFindManyPendingCommission
  service?: ReturnFindManyPendingCommission['service']
  sale: ReturnFindManyPendingCommission['sale']
  transactions: Transaction[]
}

export interface ListPendingCommissionsDTO {
  userId: string
}

export interface ListPendingCommissionsOutput {
  saleItemsRecords: PaymentItem[]
  totalCommission: number
  loans: LoanWithTransactions[]
  outstanding: number
}
