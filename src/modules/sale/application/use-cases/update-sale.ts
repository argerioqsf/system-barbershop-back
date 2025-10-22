import {
  SaleRepository,
  DetailedSale,
} from '@/modules/sale/application/ports/sale-repository'
import { UpdateSaleRequest } from '@/modules/sale/application/dto/sale'
import {
  PaymentMethod,
  PaymentStatus,
  Prisma,
  SaleStatus,
} from '@prisma/client'
import { SaleTelemetry } from '@/modules/sale/application/ports/sale-telemetry'
import { TransactionRunner } from '@/core/application/ports/transaction-runner'
import {
  TransactionRunnerLike,
  normalizeTransactionRunner,
} from '@/core/application/utils/transaction-runner'
import { defaultTransactionRunner } from '@/infra/prisma/transaction-runner'
import { UseCaseCtx } from '@/core/application/use-case-ctx'

export interface UpdateSaleUseCaseOutput {
  sale?: DetailedSale
}

export class UpdateSaleUseCase {
  private readonly transactionRunner: TransactionRunner

  constructor(
    private readonly saleRepository: SaleRepository,
    transactionRunner?: TransactionRunnerLike,
    private readonly telemetry?: SaleTelemetry,
  ) {
    this.transactionRunner = normalizeTransactionRunner(
      transactionRunner,
      defaultTransactionRunner,
    )
  }

  async execute(
    input: UpdateSaleRequest,
    ctx?: UseCaseCtx,
  ): Promise<UpdateSaleUseCaseOutput> {
    const { id, observation, method } = input
    if (!id) throw new Error('Sale ID is required')

    const currentSale = await this.saleRepository.findById(id)
    if (!currentSale) throw new Error('Sale not found')
    if (
      currentSale.paymentStatus === PaymentStatus.PAID ||
      currentSale.status === SaleStatus.COMPLETED ||
      currentSale.status === SaleStatus.CANCELLED
    ) {
      throw new Error('Cannot edit a paid, completed, or cancelled sale.')
    }

    if (method === PaymentMethod.EXEMPT && currentSale.total > 0) {
      throw new Error('invalid payment method for this sale')
    }

    if (observation === undefined && method === undefined) {
      throw new Error('No sale changes provided')
    }

    const runner: TransactionRunner = ctx?.tx
      ? {
          run: <T>(handler: (tx: Prisma.TransactionClient) => Promise<T>) => {
            const tx = ctx.tx
            if (!tx) {
              throw new Error(
                'Transaction context is missing transaction client',
              )
            }
            return handler(tx)
          },
        }
      : this.transactionRunner

    const sale = await runner.run((tx) =>
      this.saleRepository.update(
        id,
        {
          ...(observation !== undefined ? { observation } : {}),
          ...(method !== undefined ? { method } : {}),
        },
        tx,
      ),
    )

    const observationChanged =
      observation !== undefined && observation !== currentSale.observation
    const methodChanged = method !== undefined && method !== currentSale.method

    this.telemetry?.record({
      operation: 'sale.updated',
      saleId: sale.id,
      actorId: input.performedBy,
      metadata: {
        observationChanged,
        methodChanged,
      },
    })

    return { sale }
  }
}
