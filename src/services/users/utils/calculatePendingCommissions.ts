import { logger } from '@/lib/logger'
import { DetailedAppointmentService } from '@/repositories/appointment-repository'
import { DetailedSaleItemFindMany } from '@/repositories/sale-item-repository'
import { calculateRealValueSaleItem } from '@/services/sale/utils/item'
import { round } from '@/utils/format-currency'
import { Sale, Service } from '@prisma/client'

type Transaction = { amount: number }

export type PaymentItems = {
  saleId: string
  saleItemId?: string
  appointmentServiceId?: string
  amount: number
  item: DetailedSaleItemFindMany
  service?: Service
  sale?: Sale
  transactions: Transaction[]
}

export type CalculateCommissionsReturn = {
  totalCommission: number
  saleItemsRecords: PaymentItems[]
}

export function calculateCommissions(
  items: DetailedSaleItemFindMany[],
): CalculateCommissionsReturn {
  const saleItemsRecords: PaymentItems[] = []
  let totalCommission = 0

  for (const item of items) {
    if (
      item.appointment &&
      item.appointment.services &&
      item.appointment.services.length > 0
    ) {
      const records = processAppointmentItem(item, item.appointment.services)
      saleItemsRecords.push(...records)
      totalCommission += sumAmounts(records)
    } else {
      const record = processSaleItem(item)
      if (record) {
        saleItemsRecords.push(record)
        totalCommission += record.amount
      }
    }
  }

  return {
    totalCommission: round(totalCommission),
    saleItemsRecords,
  }
}

// Processa itens de venda direta (produto ou serviço)
function processSaleItem(item: DetailedSaleItemFindMany): PaymentItems | null {
  const rate = item.porcentagemBarbeiro ?? 0
  const realPriceItem = calculateRealValueSaleItem(item.price, item.discounts)
  const baseValue = realPriceItem ?? 0
  const totalPaid = sumTransactions(item.transactions)
  const commissionValue = calculateCommission(baseValue, rate)
  const remaining = round(commissionValue - totalPaid)
  logger.debug('commissionValue', { commissionValue })
  logger.debug('totalPaid', { totalPaid })
  logger.debug('remaining', { remaining })

  if (remaining <= 0) return null

  return {
    saleId: item.sale.id,
    saleItemId: item.id,
    amount: remaining,
    item,
    sale: item.sale,
    transactions: item.transactions ?? [],
  }
}

// Processa itens com serviços em agendamento
function processAppointmentItem(
  item: DetailedSaleItemFindMany,
  services: DetailedAppointmentService[],
): PaymentItems[] {
  const records: PaymentItems[] = []

  for (const svc of services) {
    const rate = svc.commissionPercentage ?? item.porcentagemBarbeiro ?? 0
    const baseValue = svc.service.price
    const totalPaid = sumTransactions(svc.transactions) * 100
    const commissionValue = calculateCommission(baseValue, rate)
    const remaining = round(commissionValue - totalPaid * 100)

    if (remaining > 0) {
      records.push({
        saleId: item.sale.id,
        saleItemId: item.id,
        appointmentServiceId: svc.id,
        amount: remaining,
        item,
        service: svc.service,
        sale: item.sale,
        transactions: svc.transactions,
      })
    }
  }

  return records
}

// Cálculo genérico de comissão
function calculateCommission(value: number, percentage: number): number {
  return round((value * percentage) / 100)
}

// Soma dos valores transacionados
function sumTransactions(transactions: Transaction[] = []): number {
  return round(transactions.reduce((sum, tx) => sum + tx.amount, 0))
}

// Soma os valores de múltiplos registros de comissão
function sumAmounts<T extends { amount: number }>(records: T[]): number {
  return round(records.reduce((sum, rec) => sum + rec.amount, 0))
}
