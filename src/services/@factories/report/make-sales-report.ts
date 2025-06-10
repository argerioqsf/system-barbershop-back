import { PrismaSaleRepository } from '@/repositories/prisma/prisma-sale-repository'
import { SalesReportService } from '@/services/report/sales-report'

export function makeSalesReport() {
  const repository = new PrismaSaleRepository()
  const service = new SalesReportService(repository)
  return service
}
