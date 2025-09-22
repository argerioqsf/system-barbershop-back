import { SaleItemUpdateFields } from '@/services/sale/types'
import {
  SaleItemUpdateExecutor,
  SaleItemUpdateExecutorResult,
  SaleItemUpdateTransactionContext,
} from '../services/sale-item-update-executor'
import {
  ensureSaleItemIdProvided,
  validateSaleItemCustomPrice,
} from '../validators/sale-item-payload'
import { SaleTelemetry } from '@/modules/sale/application/contracts/sale-telemetry'

export interface UpdateSaleItemCustomPriceInput {
  saleItemId: string
  customPrice?: number | null
  performedBy?: string
}

export type UpdateSaleItemCustomPriceOutput = SaleItemUpdateExecutorResult

export class UpdateSaleItemCustomPriceUseCase {
  constructor(
    private readonly executor: SaleItemUpdateExecutor,
    private readonly telemetry?: SaleTelemetry,
  ) {}

  async execute(
    input: UpdateSaleItemCustomPriceInput,
  ): Promise<UpdateSaleItemCustomPriceOutput> {
    const { saleItemId, customPrice, performedBy } = input

    ensureSaleItemIdProvided(saleItemId)
    validateSaleItemCustomPrice(customPrice ?? null)

    const patch: SaleItemUpdateFields = {
      customPrice: customPrice ?? null,
    }

    const hooks = this.telemetry
      ? {
          afterTransaction: async ({
            saleItemCurrent,
            saleItemUpdated,
          }: SaleItemUpdateTransactionContext) => {
            this.telemetry?.record({
              operation: 'sale.item.custom_price.updated',
              saleId: saleItemCurrent.saleId,
              actorId: performedBy,
              metadata: {
                saleItemId,
                previousCustomPrice: saleItemCurrent.customPrice,
                customPrice: saleItemUpdated.customPrice ?? null,
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
