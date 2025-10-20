import { TransactionClient } from './ports/transaction-runner'

export interface UseCaseCtx {
  tx?: TransactionClient
}
