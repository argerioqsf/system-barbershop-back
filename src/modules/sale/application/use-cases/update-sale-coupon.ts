import {
  DetailedSale,
  SaleRepository,
} from '@/modules/sale/application/ports/sale-repository'
import { CouponRepository } from '@/modules/sale/application/ports/coupon-repository'
import {
  BarberUsersRepository,
  UserFindById,
} from '@/modules/sale/application/ports/barber-users-repository'
import { SaleItemRepository } from '@/modules/sale/application/ports/sale-item-repository'
import { ReturnBuildItemData } from '@/modules/sale/application/dto/sale-item-dto'
import { CouponService } from '@/modules/sale/application/services/coupon-service'
import { calculateTotal } from '@/modules/sale/application/services/sale-totals-calculator'
import { PaymentStatus, Prisma, SaleStatus } from '@prisma/client'
import { TransactionRunner } from '@/core/application/ports/transaction-runner'
import {
  TransactionRunnerLike,
  normalizeTransactionRunner,
} from '@/core/application/utils/transaction-runner'
import { defaultTransactionRunner } from '@/infra/prisma/transaction-runner'
import { UpdateSaleRequest } from '@/modules/sale/application/dto/sale'
import { SaleTelemetry } from '@/modules/sale/application/ports/sale-telemetry'
import { DiscountSyncService } from '@/modules/sale/application/services/discount-sync-service'
import { SaleItemsBuildService } from '@/modules/sale/application/services/sale-items-build-service'
import { UseCaseCtx } from '@/core/application/use-case-ctx'

export interface UpdateSaleCouponOutput {
  sale?: DetailedSale
}

export class UpdateSaleCouponUseCase {
  private readonly transactionRunner: TransactionRunner
  private readonly couponService: CouponService

  constructor(
    private readonly saleRepository: SaleRepository,
    private readonly couponRepository: CouponRepository,
    private readonly barberUsersRepository: BarberUsersRepository,
    private readonly saleItemRepository: SaleItemRepository,
    private readonly saleItemsBuildService: SaleItemsBuildService,
    transactionRunner?: TransactionRunnerLike,
    private readonly telemetry?: SaleTelemetry,
  ) {
    this.transactionRunner = normalizeTransactionRunner(
      transactionRunner,
      defaultTransactionRunner,
    )
    this.couponService = new CouponService({
      couponRepository: this.couponRepository,
    })
  }

  async execute(
    input: UpdateSaleRequest,
    ctx?: UseCaseCtx,
  ): Promise<UpdateSaleCouponOutput> {
    const { id, couponId, removeCoupon } = input
    if (!id) throw new Error('Sale ID is required')

    const { saleCurrent, user } = await this.ensureSaleAndUser(id)

    const { saleItemsBuild } = await this.saleItemsBuildService.buildFromSale(
      saleCurrent,
      user.unitId,
    )

    const currentSaleItems: ReturnBuildItemData[] = [...saleItemsBuild]
    const changeCoupon = couponId && saleCurrent.couponId !== couponId
    let couponConnect: { connect: { id: string } } | undefined

    if (!changeCoupon && !removeCoupon) {
      throw new Error('No coupon changes')
    }

    if (changeCoupon && !removeCoupon) {
      const { couponIdConnect, saleItems } =
        await this.couponService.applyToSale({
          saleItems: currentSaleItems,
          couponId,
          userUnitId: user.unitId,
        })
      couponConnect = { connect: { id: couponIdConnect } }
      currentSaleItems.splice(0, currentSaleItems.length, ...saleItems)
    }

    const totalCurrentSaleItems = calculateTotal(currentSaleItems)

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

    const saleUpdate = await runner.run(async (tx) => {
      await this.updateSaleItems(currentSaleItems, tx)
      return this.saleRepository.update(
        id,
        {
          ...(totalCurrentSaleItems !== saleCurrent.total
            ? { total: totalCurrentSaleItems }
            : {}),
          ...(removeCoupon
            ? { couponId: null }
            : couponConnect
            ? { coupon: couponConnect }
            : {}),
        },
        tx,
      )
    })

    this.telemetry?.record({
      operation: 'sale.coupon.updated',
      saleId: saleUpdate?.id ?? id,
      actorId: input.performedBy,
      metadata: {
        previousCouponId: saleCurrent.couponId ?? null,
        newCouponId:
          saleUpdate?.couponId ?? (removeCoupon ? null : couponId ?? null),
        removed: Boolean(removeCoupon),
      },
    })

    return { sale: saleUpdate }
  }

  private async ensureSaleAndUser(saleId: string): Promise<{
    saleCurrent: DetailedSale
    user: NonNullable<UserFindById>
  }> {
    const saleCurrent = await this.saleRepository.findById(saleId)
    if (!saleCurrent) throw new Error('Sale not found')
    if (
      saleCurrent.paymentStatus === PaymentStatus.PAID ||
      saleCurrent.status === SaleStatus.COMPLETED ||
      saleCurrent.status === SaleStatus.CANCELLED
    ) {
      throw new Error('Cannot edit a paid, completed, or cancelled sale.')
    }

    const user = await this.barberUsersRepository.findById(saleCurrent.userId)
    if (!user) throw new Error('User not found')

    return { saleCurrent, user }
  }

  private async updateSaleItems(
    saleItems: ReturnBuildItemData[],
    tx: Prisma.TransactionClient,
  ) {
    const discountSync = new DiscountSyncService(this.saleItemRepository)
    for (const saleItem of saleItems) {
      if (!saleItem.id) continue
      await discountSync.sync(saleItem, saleItem.id, tx)
    }
  }
}
