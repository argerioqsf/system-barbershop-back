import { CashRegisterRepository } from '@/repositories/cash-register-repository'
import { TransactionType } from '@prisma/client'

interface CashSessionReportRequest {
  sessionId: string
}

interface CashSessionReportResponse {
  totalIn: number
  totalOut: number
  totalByService: Record<string, number>
  barberCommissions: Record<string, number>
  ownerTotal: number
}

export class CashSessionReportService {
  constructor(private repository: CashRegisterRepository) {}

  async execute({
    sessionId,
  }: CashSessionReportRequest): Promise<CashSessionReportResponse> {
    const session = await this.repository.findById(sessionId)
    if (!session) throw new Error('Session not found')

    const additions = session.transactions
      .filter((t) => t.type === TransactionType.ADDITION)
      .reduce((acc, t) => acc + t.amount, 0)
    const withdrawals = session.transactions
      .filter((t) => t.type === TransactionType.WITHDRAWAL)
      .reduce((acc, t) => acc + t.amount, 0)

    const totalByService: Record<string, number> = {}
    const barberCommissions: Record<string, number> = {}
    let ownerTotal = 0

    for (const sale of session.sales) {
      const totals = sale.items.reduce(
        (t, item) => {
          const price = item.service?.price ?? item.product?.price ?? 0
          const value = price * item.quantity
          if (item.product) {
            t.product += value
          } else if (item.service) {
            t.service += value
            t.byService[item.service.name] =
              (t.byService[item.service.name] || 0) + value
          }
          t.total += value
          return t
        },
        {
          service: 0,
          product: 0,
          total: 0,
          byService: {} as Record<string, number>,
        },
      )

      if (sale.coupon) {
        if (sale.coupon.discountType === 'PERCENTAGE') {
          for (const name of Object.keys(totals.byService)) {
            totals.byService[name] *= 1 - sale.coupon.discount / 100
          }
          totals.service *= 1 - sale.coupon.discount / 100
          totals.product *= 1 - sale.coupon.discount / 100
        } else {
          const totalBefore = totals.service + totals.product
          for (const name of Object.keys(totals.byService)) {
            const disc =
              (totals.byService[name] / totalBefore) * sale.coupon.discount
            totals.byService[name] -= disc
          }
          const serviceDisc =
            (totals.service / totalBefore) * sale.coupon.discount
          const productDisc =
            (totals.product / totalBefore) * sale.coupon.discount
          totals.service -= serviceDisc
          totals.product -= productDisc
        }
      }

      Object.entries(totals.byService).forEach(([name, value]) => {
        totalByService[name] = (totalByService[name] || 0) + value
      })

      const barberPerc = sale.user.profile?.commissionPercentage ?? 100
      const barberValue = totals.service * (barberPerc / 100)
      barberCommissions[sale.user.id] =
        (barberCommissions[sale.user.id] || 0) + barberValue

      ownerTotal += totals.service - barberValue + totals.product
    }

    return {
      totalIn: Number(additions.toFixed(2)),
      totalOut: Number(withdrawals.toFixed(2)),
      totalByService: Object.fromEntries(
        Object.entries(totalByService).map(([k, v]) => [
          k,
          Number(v.toFixed(2)),
        ]),
      ),
      barberCommissions: Object.fromEntries(
        Object.entries(barberCommissions).map(([k, v]) => [
          k,
          Number(v.toFixed(2)),
        ]),
      ),
      ownerTotal: Number(ownerTotal.toFixed(2)),
    }
  }
}
