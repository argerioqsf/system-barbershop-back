import { SaleItemRepository } from '@/repositories/sale-item-repository'
import {
  LoanRepository,
  LoanWithTransactions,
} from '@/repositories/loan-repository'
import { LoanStatus, PaymentStatus } from '@prisma/client'
import {
  calculateCommissions,
  PaymentItems,
} from './utils/calculatePendingCommissions'

interface ListUserPendingCommissionsRequest {
  userId: string
}

interface ListUserPendingCommissionsResponse {
  saleItemsRecords: PaymentItems[]
  totalCommission: number
  loans: LoanWithTransactions[]
  outstanding: number
}

export class ListUserPendingCommissionsService {
  constructor(
    private saleItemRepository: SaleItemRepository,
    private loanRepository: LoanRepository,
  ) {}

  async execute({
    userId,
  }: ListUserPendingCommissionsRequest): Promise<ListUserPendingCommissionsResponse> {
    const saleItems = await this.saleItemRepository.findMany({
      barberId: userId,
      sale: { paymentStatus: PaymentStatus.PAID },
      commissionPaid: false,
      OR: [
        { appointmentId: { not: null } },
        { serviceId: { not: null } },
        { productId: { not: null } },
      ],
    })

    const loans = await this.loanRepository.findMany({
      userId,
      status: LoanStatus.PAID,
      fullyPaid: false,
    })

    const { totalCommission, saleItemsRecords } = await calculateCommissions(
      saleItems,
    )

    const outstanding = loans.reduce((sum, loan) => {
      const paid = loan.transactions.reduce(
        (s, t) => (t.amount > 0 ? s + t.amount : s),
        0,
      )
      const remain = loan.amount - paid
      return remain > 0 ? sum + remain : sum
    }, 0)

    return {
      saleItemsRecords,
      totalCommission,
      outstanding: -outstanding,
      loans,
    }
  }
}
