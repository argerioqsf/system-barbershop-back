import { ProductRepository } from '@/modules/sale/application/ports/product-repository'
import { SaleItemUpdateFields } from '@/modules/sale/application/dto/sale'
import { ProductToUpdate } from '@/modules/sale/application/dto/sale-item-dto'
import { StockService } from '@/modules/sale/application/services/stock-service'
import {
  SaleItemUpdateExecutor,
  SaleItemUpdateExecutorResult,
  SaleItemUpdateHookContext,
  SaleItemUpdateTransactionContext,
} from '../services/sale-item-update-executor'
import {
  ensureHasChanges,
  ensureSaleItemIdProvided,
  ensureSingleItemType,
  validateSaleItemQuantity,
} from '../validators/sale-item-payload'
import { SaleTelemetry } from '@/modules/sale/application/ports/sale-telemetry'

interface ProductAdjustmentMetadata {
  productsToUpdate: ProductToUpdate[]
  productsToRestore: { id: string; quantity: number }[]
}

export interface UpdateSaleItemDetailsInput {
  saleItemId: string
  serviceId?: string | null
  productId?: string | null
  appointmentId?: string | null
  planId?: string | null
  quantity?: number
  performedBy?: string
}

export type UpdateSaleItemDetailsOutput = SaleItemUpdateExecutorResult

export class UpdateSaleItemDetailsUseCase {
  private readonly stockService: StockService

  constructor(
    private readonly executor: SaleItemUpdateExecutor,
    private readonly productRepository: ProductRepository,
    private readonly telemetry?: SaleTelemetry,
  ) {
    this.stockService = new StockService(productRepository)
  }

  async execute(
    input: UpdateSaleItemDetailsInput,
  ): Promise<UpdateSaleItemDetailsOutput> {
    const {
      saleItemId,
      serviceId,
      productId,
      appointmentId,
      planId,
      quantity,
      performedBy,
    } = input

    ensureSaleItemIdProvided(saleItemId)
    ensureSingleItemType({ serviceId, productId, appointmentId, planId })
    validateSaleItemQuantity(quantity)
    ensureHasChanges({ serviceId, productId, appointmentId, planId, quantity })

    const patch: SaleItemUpdateFields = {
      serviceId,
      productId,
      appointmentId,
      planId,
    }

    if (quantity !== undefined) {
      patch.quantity = quantity
    }

    const hooks = {
      beforeRebuild: async (context: SaleItemUpdateHookContext) => {
        const adjustments = await this.computeProductAdjustments(context)
        if (adjustments.productsToUpdate.length > 0) {
          await this.stockService.ensureAvailability(
            adjustments.productsToUpdate,
          )
        }
        return { productAdjustments: adjustments }
      },
      afterTransaction: async ({
        metadata,
        tx,
        saleItemCurrent,
        saleItemUpdated,
      }: SaleItemUpdateTransactionContext) => {
        const adjustments = metadata.productAdjustments as
          | ProductAdjustmentMetadata
          | undefined
        if (adjustments) {
          if (adjustments.productsToUpdate.length > 0) {
            await this.stockService.adjust(
              adjustments.productsToUpdate,
              'decrement',
              tx,
            )
          }

          if (adjustments.productsToRestore.length > 0) {
            await this.stockService.adjust(
              adjustments.productsToRestore,
              'increment',
              tx,
            )
          }
        }

        this.telemetry?.record({
          operation: 'sale.item.details.updated',
          saleId: saleItemCurrent.saleId,
          actorId: performedBy,
          metadata: {
            saleItemId,
            previous: {
              serviceId: saleItemCurrent.serviceId,
              productId: saleItemCurrent.productId,
              appointmentId: saleItemCurrent.appointmentId,
              planId: saleItemCurrent.planId,
              quantity: saleItemCurrent.quantity,
            },
            updated: {
              serviceId: saleItemUpdated.serviceId ?? null,
              productId: saleItemUpdated.productId ?? null,
              appointmentId: saleItemUpdated.appointmentId ?? null,
              planId: saleItemUpdated.planId ?? null,
              quantity: saleItemUpdated.quantity,
            },
          },
        })
      },
    }

    return this.executor.execute({
      saleItemId,
      patch,
      hooks,
    })
  }

  private async computeProductAdjustments(
    context: SaleItemUpdateHookContext,
  ): Promise<ProductAdjustmentMetadata> {
    const { saleItemCurrent, saleItemUpdated } = context

    const productsToUpdate: ProductToUpdate[] = []
    const productsToRestore: { id: string; quantity: number }[] = []

    const currentProductId = saleItemCurrent.productId ?? undefined
    const updatedProductId = saleItemUpdated.productId ?? undefined

    const currentQuantity = saleItemCurrent.quantity
    const updatedQuantity = saleItemUpdated.quantity

    if (updatedProductId) {
      if (!currentProductId) {
        productsToUpdate.push({
          id: updatedProductId,
          quantity: updatedQuantity,
          saleItemId: saleItemUpdated.id ?? saleItemCurrent.id,
        })
      } else if (currentProductId !== updatedProductId) {
        productsToRestore.push({
          id: currentProductId,
          quantity: currentQuantity,
        })
        productsToUpdate.push({
          id: updatedProductId,
          quantity: updatedQuantity,
          saleItemId: saleItemUpdated.id ?? saleItemCurrent.id,
        })
      } else {
        const quantityDifference = updatedQuantity - currentQuantity
        if (quantityDifference > 0) {
          productsToUpdate.push({
            id: updatedProductId,
            quantity: quantityDifference,
            saleItemId: saleItemCurrent.id,
          })
        } else if (quantityDifference < 0) {
          productsToRestore.push({
            id: updatedProductId,
            quantity: Math.abs(quantityDifference),
          })
        }
      }
    } else if (currentProductId) {
      productsToRestore.push({
        id: currentProductId,
        quantity: currentQuantity,
      })
    }

    return {
      productsToUpdate,
      productsToRestore,
    }
  }
}
