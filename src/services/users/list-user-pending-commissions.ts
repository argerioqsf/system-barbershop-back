import { SaleItemRepository } from '@/repositories/sale-item-repository'
import {
  LoanRepository,
  LoanWithTransactions,
} from '@/repositories/loan-repository'
import { PaymentStatus, Transaction } from '@prisma/client'

interface PendingCommissionItem {
  saleId: string
  saleItemId: string
  amount: number
  porcentagebarber: number
  transactions: Transaction[]
}

interface PendingCommissionService {
  saleId: string
  saleItemId: string
  appointmentServiceId: string
  amount: number
  porcentagebarber: number
  transactions: Transaction[]
}

interface ListUserPendingCommissionsRequest {
  userId: string
}

interface ListUserPendingCommissionsResponse {
  saleItems: PendingCommissionItem[]
  appointmentServices: PendingCommissionService[]
  total: number
  loans: LoanWithTransactions[]
}

export class ListUserPendingCommissionsService {
  constructor(
    private saleItemRepository: SaleItemRepository,
    private loanRepository: LoanRepository,
  ) {}

  async execute({
    userId,
  }: ListUserPendingCommissionsRequest): Promise<ListUserPendingCommissionsResponse> {
    const saleItems: PendingCommissionItem[] = []
    const appointmentServices: PendingCommissionService[] = []

    const salesItems = await this.saleItemRepository.findMany({
      barberId: userId,
      sale: { paymentStatus: PaymentStatus.PAID },
      commissionPaid: false,
      OR: [{ serviceId: { not: null } }, { productId: { not: null } }],
    })

    const salesItemsAppointment = await this.saleItemRepository.findMany({
      barberId: userId,
      sale: { paymentStatus: PaymentStatus.PAID },
      commissionPaid: false,
      appointmentId: {
        not: null,
      },
    })
    let total = 0

    for (const item of salesItems) {
      const perc = item.porcentagemBarbeiro ?? 0
      const value = ((item.price ?? 0) * perc) / 100
      const paid =
        item.transactions?.reduce(
          (s: number, t: { amount: number }) => s + t.amount,
          0,
        ) ?? 0
      const remaining = value - paid
      if (remaining > 0) {
        total += remaining
        saleItems.push({
          saleId: item.sale.id,
          saleItemId: item.id,
          amount: remaining,
          porcentagebarber: perc,
          transactions: item.transactions,
        })
      }
    }

    for (const item of salesItemsAppointment) {
      for (const service of item.appointment?.services ?? []) {
        const perc =
          service.commissionPercentage ?? item.porcentagemBarbeiro ?? 0
        const value = (service.service.price * perc) / 100
        const paid =
          service.transactions.reduce(
            (s: number, t: { amount: number }) => s + t.amount,
            0,
          ) ?? 0
        const remaining = value - paid
        if (remaining > 0) {
          total += remaining
          appointmentServices.push({
            saleId: item.sale.id,
            saleItemId: item.id,
            appointmentServiceId: service.id,
            amount: remaining,
            porcentagebarber: perc,
            transactions: service.transactions,
          })
        }
      }
    }

    const loans = await this.loanRepository.findMany({ userId })
    const outstanding = loans.reduce((sum, loan) => {
      const paid = loan.transactions.reduce(
        (s, t) => (t.amount > 0 ? s + t.amount : s),
        0,
      )
      const remain = loan.amount - paid
      return remain > 0 ? sum + remain : sum
    }, 0)

    total -= outstanding

    return { saleItems, appointmentServices, total, loans }
  }
}
