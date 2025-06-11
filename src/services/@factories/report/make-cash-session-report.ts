import { PrismaCashRegisterRepository } from '@/repositories/prisma/prisma-cash-register-repository'
import { CashSessionReportService } from '@/services/report/cash-session-report'

export function makeCashSessionReport() {
  return new CashSessionReportService(new PrismaCashRegisterRepository())
}
