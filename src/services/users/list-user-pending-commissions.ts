import { SaleRepository } from '@/repositories/sale-repository'
import { AppointmentService } from '@prisma/client'

interface PendingCommissionItem {
  saleId: string
  saleItemId: string
  amount: number
}

interface PendingCommissionService {
  saleId: string
  saleItemId: string
  appointmentServiceId: string
  amount: number
}

interface ListUserPendingCommissionsRequest {
  userId: string
}

interface ListUserPendingCommissionsResponse {
  saleItems: PendingCommissionItem[]
  appointmentServices: PendingCommissionService[]
}

export class ListUserPendingCommissionsService {
  constructor(private repository: SaleRepository) {}

  async execute({
    userId,
  }: ListUserPendingCommissionsRequest): Promise<ListUserPendingCommissionsResponse> {
    const sales = await this.repository.findManyByBarber(userId)
    const saleItems: PendingCommissionItem[] = []
    const appointmentServices: PendingCommissionService[] = []

    for (const sale of sales) {
      if (sale.paymentStatus !== 'PAID') continue
      for (const item of sale.items) {
        if (item.barberId !== userId) continue
        if ((item as any).commissionPaid) continue
        const perc = item.porcentagemBarbeiro ?? 0
        const total = ((item.price ?? 0) * perc) / 100
        const paid =
          (item as any).transactions?.reduce(
            (s: number, t: { amount: number }) => s + t.amount,
            0,
          ) ?? 0
        const remaining = total - paid
        if (remaining > 0) {
          saleItems.push({
            saleId: sale.id,
            saleItemId: item.id,
            amount: remaining,
          })
        }
        if (item.appointment?.services?.length) {
          for (const srv of item.appointment.services) {
            const percSrv = srv.commissionPercentage ?? 0
            const totalSrv = (srv.service.price * percSrv) / 100
            const paidSrv =
              (srv as any).transactions?.reduce(
                (s: number, t: { amount: number }) => s + t.amount,
                0,
              ) ?? 0
            const remainingSrv = totalSrv - paidSrv
            if (remainingSrv > 0) {
              appointmentServices.push({
                saleId: sale.id,
                saleItemId: item.id,
                appointmentServiceId: srv.id,
                amount: remainingSrv,
              })
            }
          }
        }
      }
    }

    return { saleItems, appointmentServices }
  }
}
