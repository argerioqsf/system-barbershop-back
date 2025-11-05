import { PayDebtService } from '@/services/plan/pay-debt'
import { PayDebtDTO } from '../dto/pay-debt.dto'

/**
 * Temporary facade to expose the legacy PayDebtService through the new module boundary.
 * TODO: Replace with a dedicated domain use case once the repayment flow is migrated.
 */
export class PayDebtUseCase {
  constructor(private readonly payDebtService: PayDebtService) {}

  execute(command: PayDebtDTO) {
    return this.payDebtService.execute(command)
  }
}
