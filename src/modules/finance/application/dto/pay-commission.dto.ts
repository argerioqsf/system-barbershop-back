import { TransactionClient } from '@/core/application/ports/transaction-runner'
import { Money } from '@/core/domain/value-objects/money'
import { TransactionReason } from '@/modules/finance/domain/entities/transaction'
import { CommissionCalculationItem } from '@/modules/finance/domain/services/commission-calculator'
import {
  DetailedAppointmentService,
  ReturnFindManyPendingCommission,
} from '@/repositories/sale-item-repository'
import { Transaction } from '@prisma/client'

type CommissionMeta = {
  saleId: string
  saleItemId: string
  appointmentServiceId?: string
  saleItem: ReturnFindManyPendingCommission
  appointmentService?: DetailedAppointmentService
}

export interface CommissionPreviewFilters {
  saleItemIds?: string[]
  appointmentServiceIds?: string[]
}

export interface CommissionPreviewResult {
  total: Money
  items: CommissionCalculationItem<CommissionMeta>[]
}

export interface PayCommissionDTO {
  actorId: string
  affectedUserId: string
  description?: string
  amount?: Money
  saleItemIds?: string[]
  appointmentServiceIds?: string[]
  reason?: TransactionReason
  tx?: TransactionClient
}

export interface PayCommissionOutput {
  transactions: Transaction[]
  totalPaid: Money
}
