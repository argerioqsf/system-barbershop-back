import { SaleRepository, DetailedSale } from '@/repositories/sale-repository'
import { UpdateSaleRequest } from '@/services/sale/types'
import { PaymentMethod, PaymentStatus, SaleStatus } from '@prisma/client'
import { SaleTelemetry } from '@/modules/sale/application/contracts/sale-telemetry'
import { TransactionRunner } from '@/core/application/ports/transaction-runner'
import {
  TransactionRunnerLike,
  normalizeTransactionRunner,
} from '@/core/application/utils/transaction-runner'
import { defaultTransactionRunner } from '@/infra/prisma/transaction-runner'

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

  async execute(input: UpdateSaleRequest): Promise<UpdateSaleUseCaseOutput> {
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

    const sale = await this.transactionRunner.run((tx) =>
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
