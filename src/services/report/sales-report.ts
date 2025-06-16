import { SaleRepository } from '@/repositories/sale-repository'

interface SalesReportRequest {
  startDate: Date
  endDate: Date
}

interface SalesReportResponse {
  total: number
  count: number
}

export class SalesReportService {
  constructor(private repository: SaleRepository) {}

  async execute({
    startDate,
    endDate,
  }: SalesReportRequest): Promise<SalesReportResponse> {
    const sales = await this.repository.findManyByDateRange(startDate, endDate)
    const total = sales.reduce((acc, sale) => acc + sale.total, 0)
    return { total, count: sales.length }
  }
}
