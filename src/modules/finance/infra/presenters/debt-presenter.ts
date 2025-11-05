import { DebtRecord } from '@/modules/finance/application/ports/debts-repository'
import { MoneyMapper } from '@/modules/finance/infra/mappers/money-mapper'

export interface DebtHttp {
  id: string
  planId: string
  planProfileId: string
  value: number
  status: string
  dueDate: Date
  paymentDate: Date | null
  createdAt: Date
}

export class DebtPresenter {
  static toHTTP(record: DebtRecord): DebtHttp {
    return {
      id: record.id,
      planId: record.planId,
      planProfileId: record.planProfileId,
      value: MoneyMapper.toNumber(record.amount),
      status: record.status,
      dueDate: record.dueDate,
      paymentDate: record.paymentDate,
      createdAt: record.createdAt,
    }
  }
}
