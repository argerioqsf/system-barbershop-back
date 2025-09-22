import { ProductRepository } from '@/repositories/product-repository'
import { SaleItemUpdateFields } from '@/services/sale/types'
import {
  ProductToUpdate,
  verifyStockProducts,
} from '@/services/sale/utils/item'
import { updateProductsStock } from '@/services/sale/utils/sale'
import {
  SaleItemUpdateExecutor,
  SaleItemUpdateExecutorResult,
  SaleItemUpdateHookContext,
  SaleItemUpdateTransactionContext,
} from '../services/sale-item-update-executor'
import {
  ensureSaleItemIdProvided,
  validateSaleItemQuantity,
} from '../validators/sale-item-payload'
import { SaleTelemetry } from '@/modules/sale/application/contracts/sale-telemetry'

interface ProductAdjustmentMetadata {
  productsToUpdate: ProductToUpdate[]
  productsToRestore: { id: string; quantity: number }[]
}

export interface UpdateSaleItemQuantityInput {
  saleItemId: string
  quantity: number
  performedBy?: string
}

export type UpdateSaleItemQuantityOutput = SaleItemUpdateExecutorResult

export class UpdateSaleItemQuantityUseCase {
  constructor(
    private readonly executor: SaleItemUpdateExecutor,
    private readonly productRepository: ProductRepository,
    private readonly telemetry?: SaleTelemetry,
  ) {}

  async execute(
    input: UpdateSaleItemQuantityInput,
  ): Promise<UpdateSaleItemQuantityOutput> {
    const { saleItemId, quantity, performedBy } = input

    ensureSaleItemIdProvided(saleItemId)
    validateSaleItemQuantity(quantity)

    const patch: SaleItemUpdateFields = {
      quantity,
    }

    const hooks = {
      beforeRebuild: async (context: SaleItemUpdateHookContext) => {
        const adjustments = await this.computeProductAdjustments(context)
        if (adjustments.productsToUpdate.length > 0) {
          await verifyStockProducts(
            this.productRepository,
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
            await updateProductsStock(
              this.productRepository,
              adjustments.productsToUpdate,
              'decrement',
              tx,
            )
          }

          if (adjustments.productsToRestore.length > 0) {
            await updateProductsStock(
              this.productRepository,
              adjustments.productsToRestore,
              'increment',
              tx,
            )
          }
        }

        this.telemetry?.record({
          operation: 'sale.item.quantity.updated',
          saleId: saleItemCurrent.saleId,
          actorId: performedBy,
          metadata: {
            saleItemId,
            previousQuantity: saleItemCurrent.quantity,
            newQuantity: saleItemUpdated.quantity,
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

    if (!saleItemUpdated.productId && !saleItemCurrent.productId) {
      return {
        productsToUpdate: [],
        productsToRestore: [],
      }
    }

    const productsToUpdate: ProductToUpdate[] = []
    const productsToRestore: { id: string; quantity: number }[] = []

    if (saleItemUpdated.productId) {
      if (saleItemUpdated.productId !== saleItemCurrent.productId) {
        productsToUpdate.push({
          id: saleItemUpdated.productId,
          quantity: saleItemUpdated.quantity,
          saleItemId: saleItemUpdated.id ?? saleItemCurrent.id,
        })

        if (saleItemCurrent.productId) {
          productsToRestore.push({
            id: saleItemCurrent.productId,
            quantity: saleItemCurrent.quantity,
          })
        }
      } else {
        const quantityDifference =
          saleItemUpdated.quantity - saleItemCurrent.quantity
        if (quantityDifference > 0) {
          productsToUpdate.push({
            id: saleItemUpdated.productId,
            quantity: quantityDifference,
            saleItemId: saleItemCurrent.id,
          })
        } else if (quantityDifference < 0) {
          productsToRestore.push({
            id: saleItemUpdated.productId,
            quantity: Math.abs(quantityDifference),
          })
        }
      }
    } else if (saleItemCurrent.productId) {
      // Product removed: restore previous stock
      productsToRestore.push({
        id: saleItemCurrent.productId,
        quantity: saleItemCurrent.quantity,
      })
    }

    return {
      productsToUpdate,
      productsToRestore,
    }
  }
}
