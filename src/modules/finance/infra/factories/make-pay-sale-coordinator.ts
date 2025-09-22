import { DefaultPaySaleCoordinator } from '@/modules/finance/application/coordinators/pay-sale-coordinator'
import { makePaySaleUseCase } from '@/modules/finance/infra/factories/make-pay-sale'
import { makeRecalculateUserSales } from '@/modules/sale/infra/factories/make-recalculate-user-sales'

export function makePaySaleCoordinator() {
  const paySaleUseCase = makePaySaleUseCase()
  const recalculateUserSalesService = makeRecalculateUserSales()

  return new DefaultPaySaleCoordinator(
    paySaleUseCase,
    recalculateUserSalesService,
  )
}
