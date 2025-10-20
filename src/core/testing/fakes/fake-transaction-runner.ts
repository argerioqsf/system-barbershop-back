import {
  TransactionClient,
  TransactionRunner,
} from '@/core/application/ports/transaction-runner'

/**
 * Simple fake runner that forwards the call with a stub transaction client.
 * Useful for unit tests that do not care about database interaction.
 */
export class FakeTransactionRunner implements TransactionRunner {
  constructor(
    private readonly transaction: TransactionClient = {} as TransactionClient,
  ) {}

  async run<T>(handler: (tx: TransactionClient) => Promise<T>): Promise<T> {
    return handler(this.transaction)
  }
}
