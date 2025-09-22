import {
  PaySaleCoordinator,
  PaySaleInput,
  PaySaleOutput,
} from '../contracts/pay-sale-coordinator'
import { PaySaleUseCase } from '@/modules/finance/application/use-cases/pay-sale'
import { RecalculateUserSalesService } from '@/modules/sale/application/use-cases/recalculate-user-sales'
import { logger } from '@/lib/logger'

export class DefaultPaySaleCoordinator implements PaySaleCoordinator {
  constructor(
    private readonly paySaleUseCase: PaySaleUseCase,
    private readonly recalculateUserSalesService: RecalculateUserSalesService,
  ) {}

  async execute({ saleId, userId }: PaySaleInput): Promise<PaySaleOutput> {
    const { sale } = await this.paySaleUseCase.execute({ saleId, userId })

    await this.recalculateUserSalesService.execute({
      userIds: [sale.clientId],
    })

    logger.info('Sale paid successfully', {
      operation: 'pay-sale',
      saleId: sale.id,
      userId,
    })

    return {
      sale,
    }
  }
}
