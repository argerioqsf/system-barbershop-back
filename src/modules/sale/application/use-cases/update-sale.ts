import { SaleRepository, DetailedSale } from '@/repositories/sale-repository'
import { UpdateSaleRequest } from '@/services/sale/types'
import {
  PaymentMethod,
  PaymentStatus,
  Prisma,
  SaleStatus,
} from '@prisma/client'
import { SaleTelemetry } from '@/modules/sale/application/contracts/sale-telemetry'

export type TransactionRunner = <T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
) => Promise<T>

export interface UpdateSaleUseCaseOutput {
  sale?: DetailedSale
}

export class UpdateSaleUseCase {
  constructor(
    private readonly saleRepository: SaleRepository,
    private readonly runInTransaction: TransactionRunner,
    private readonly telemetry?: SaleTelemetry,
  ) {}

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

    const sale = await this.runInTransaction((tx) =>
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
