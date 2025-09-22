import { SaleItemUpdateFields } from '@/services/sale/types'
import {
  SaleItemUpdateExecutor,
  SaleItemUpdateExecutorResult,
  SaleItemUpdateTransactionContext,
} from '../services/sale-item-update-executor'
import { ensureSaleItemIdProvided } from '../validators/sale-item-payload'
import { SaleTelemetry } from '@/modules/sale/application/contracts/sale-telemetry'

export interface UpdateSaleItemBarberInput {
  saleItemId: string
  barberId?: string | null
  performedBy?: string
}

export type UpdateSaleItemBarberOutput = SaleItemUpdateExecutorResult

export class UpdateSaleItemBarberUseCase {
  constructor(
    private readonly executor: SaleItemUpdateExecutor,
    private readonly telemetry?: SaleTelemetry,
  ) {}

  async execute(
    input: UpdateSaleItemBarberInput,
  ): Promise<UpdateSaleItemBarberOutput> {
    const { saleItemId, barberId, performedBy } = input

    ensureSaleItemIdProvided(saleItemId)

    const patch: SaleItemUpdateFields = {
      barberId: barberId ?? null,
    }

    const hooks = this.telemetry
      ? {
          afterTransaction: async ({
            saleItemCurrent,
            saleItemUpdated,
          }: SaleItemUpdateTransactionContext) => {
            this.telemetry?.record({
              operation: 'sale.item.barber.updated',
              saleId: saleItemCurrent.saleId,
              actorId: performedBy,
              metadata: {
                saleItemId,
                previousBarberId: saleItemCurrent.barberId ?? null,
                newBarberId: saleItemUpdated.barberId ?? null,
              },
            })
          },
        }
      : undefined

    return this.executor.execute({
      saleItemId,
      patch,
      hooks,
    })
  }
}
