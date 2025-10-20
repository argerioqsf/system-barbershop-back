import { Prisma } from '@prisma/client'

import { TransactionRunner } from '@/core/application/ports/transaction-runner'

type RunnerFn = <T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
) => Promise<T>

export type TransactionRunnerLike = TransactionRunner | RunnerFn | undefined

export function normalizeTransactionRunner(
  runner: TransactionRunnerLike,
  fallback: TransactionRunner,
): TransactionRunner {
  if (!runner) return fallback

  if (typeof (runner as TransactionRunner).run === 'function') {
    return runner as TransactionRunner
  }

  const runnerFn = runner as RunnerFn
  return {
    run: (fn) => runnerFn(fn),
  }
}
