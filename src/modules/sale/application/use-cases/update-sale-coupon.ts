import { DetailedSale, SaleRepository } from '@/repositories/sale-repository'
import { CouponRepository } from '@/repositories/coupon-repository'
import {
  BarberUsersRepository,
  UserFindById,
} from '@/repositories/barber-users-repository'
import { SaleItemRepository } from '@/repositories/sale-item-repository'
import { GetItemsBuildService } from '@/services/sale/get-items-build'
import {
  ReturnBuildItemData,
  updateDiscountsOnSaleItem,
} from '@/services/sale/utils/item'
import { applyCouponSale } from '@/services/sale/utils/coupon'
import { calculateTotal } from '@/services/sale/utils/sale'
import { PaymentStatus, Prisma, SaleStatus } from '@prisma/client'
import { TransactionRunner } from '@/core/application/ports/transaction-runner'
import {
  TransactionRunnerLike,
  normalizeTransactionRunner,
} from '@/core/application/utils/transaction-runner'
import { defaultTransactionRunner } from '@/infra/prisma/transaction-runner'
import { UpdateSaleRequest } from '@/services/sale/types'
import { SaleTelemetry } from '@/modules/sale/application/contracts/sale-telemetry'

export interface UpdateSaleCouponOutput {
  sale?: DetailedSale
}

export class UpdateSaleCouponUseCase {
  private readonly transactionRunner: TransactionRunner

  constructor(
    private readonly saleRepository: SaleRepository,
    private readonly couponRepository: CouponRepository,
    private readonly barberUsersRepository: BarberUsersRepository,
    private readonly saleItemRepository: SaleItemRepository,
    private readonly getItemsBuildService: GetItemsBuildService,
    transactionRunner?: TransactionRunnerLike,
    private readonly telemetry?: SaleTelemetry,
  ) {
    this.transactionRunner = normalizeTransactionRunner(
      transactionRunner,
      defaultTransactionRunner,
    )
  }

  async execute(input: UpdateSaleRequest): Promise<UpdateSaleCouponOutput> {
    const { id, couponId, removeCoupon } = input
    if (!id) throw new Error('Sale ID is required')

    const { saleCurrent, user } = await this.ensureSaleAndUser(id)

    const { saleItemsBuild } = await this.getItemsBuildService.execute({
      saleItems: saleCurrent.items,
      unitId: user.unitId,
    })

    const currentSaleItems: ReturnBuildItemData[] = [...saleItemsBuild]
    const changeCoupon = couponId && saleCurrent.couponId !== couponId
    let couponConnect: { connect: { id: string } } | undefined

    if (!changeCoupon && !removeCoupon) {
      throw new Error('No coupon changes')
    }

    if (changeCoupon && !removeCoupon) {
      const { couponIdConnect, saleItems } = await applyCouponSale(
        currentSaleItems,
        couponId,
        this.couponRepository,
        user.unitId,
      )
      couponConnect = { connect: { id: couponIdConnect } }
      currentSaleItems.splice(0, currentSaleItems.length, ...saleItems)
    }

    const totalCurrentSaleItems = calculateTotal(currentSaleItems)

    const saleUpdate = await this.transactionRunner.run(async (tx) => {
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
    for (const saleItem of saleItems) {
      if (!saleItem.id) continue
      await updateDiscountsOnSaleItem(
        saleItem,
        saleItem.id,
        this.saleItemRepository,
        tx,
      )
    }
  }
}
