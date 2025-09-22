import { CouponNotFoundError } from '@/services/@errors/coupon/coupon-not-found-error'
import { SaleItemUpdateFields } from '@/services/sale/types'
import { CouponRepository } from '@/repositories/coupon-repository'
import {
  SaleItemUpdateExecutor,
  SaleItemUpdateExecutorResult,
  SaleItemUpdateTransactionContext,
} from '../services/sale-item-update-executor'
import { ensureSaleItemIdProvided } from '../validators/sale-item-payload'
import { SaleTelemetry } from '@/modules/sale/application/contracts/sale-telemetry'

export interface UpdateSaleItemCouponInput {
  saleItemId: string
  couponId?: string | null
  couponCode?: string | null
  performedBy?: string
}

export type UpdateSaleItemCouponOutput = SaleItemUpdateExecutorResult

export class UpdateSaleItemCouponUseCase {
  constructor(
    private readonly executor: SaleItemUpdateExecutor,
    private readonly couponRepository: CouponRepository,
    private readonly telemetry?: SaleTelemetry,
  ) {}

  async execute(
    input: UpdateSaleItemCouponInput,
  ): Promise<UpdateSaleItemCouponOutput> {
    const { saleItemId, couponCode, couponId, performedBy } = input

    ensureSaleItemIdProvided(saleItemId)

    const patch: SaleItemUpdateFields = {}

    if (couponCode) {
      const coupon = await this.couponRepository.findByCode(couponCode)
      if (!coupon) throw new CouponNotFoundError()
      patch.couponId = coupon.id
    } else {
      patch.couponId = couponId ?? null
    }

    const hooks = this.telemetry
      ? {
          afterTransaction: async ({
            saleItemCurrent,
            saleItemUpdated,
          }: SaleItemUpdateTransactionContext) => {
            this.telemetry?.record({
              operation: 'sale.item.coupon.updated',
              saleId: saleItemCurrent.saleId,
              actorId: performedBy,
              metadata: {
                saleItemId,
                previousCouponId: saleItemCurrent.couponId ?? null,
                newCouponId: saleItemUpdated.couponId ?? null,
                couponCode: patch.couponCode ?? null,
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
