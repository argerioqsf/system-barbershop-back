import { SaleRepository, DetailedSale } from '@/repositories/sale-repository'
import { CouponRepository } from '@/repositories/coupon-repository'
import {
  BarberUsersRepository,
  UserFindById,
} from '@/repositories/barber-users-repository'
import { SaleItemRepository } from '@/repositories/sale-item-repository'
import { GetItemsBuildResponse, UpdateSaleRequest } from './types'
import { PaymentStatus, Prisma } from '@prisma/client'
import { CannotEditPaidSaleError } from '../@errors/sale/cannot-edit-paid-sale-error'
import { applyCouponSale } from './utils/coupon'
import { ReturnBuildItemData, updateDiscountsOnSaleItem } from './utils/item'
import { calculateTotal } from './utils/sale'
import { prisma } from '@/lib/prisma'
import { makeGetItemsBuildService } from '../@factories/sale/make-get-items-build'

interface UpdateSaleResponse {
  sale?: DetailedSale
}

export class UpdateCouponSaleService {
  constructor(
    private repository: SaleRepository,
    private couponRepository: CouponRepository,
    private barberUserRepository: BarberUsersRepository,
    private saleItemRepository: SaleItemRepository,
  ) {}

  private async initVerify(id: string): Promise<{
    saleCurrent: NonNullable<DetailedSale>
    user: NonNullable<UserFindById>
  }> {
    if (!id) throw new Error('Sale ID is required')

    const saleCurrent = await this.repository.findById(id)
    if (!saleCurrent) throw new Error('Sale not found')
    if (saleCurrent.paymentStatus === PaymentStatus.PAID) {
      throw new CannotEditPaidSaleError()
    }

    const user = await this.barberUserRepository.findById(saleCurrent.userId)
    if (!user) throw new Error('User not found')

    return { saleCurrent, user }
  }

  private async updateSaleItems(
    saleItems: ReturnBuildItemData[],
    saleItemRepository: SaleItemRepository,
    tx: Prisma.TransactionClient,
  ) {
    for (const saleItem of saleItems) {
      if (saleItem.id) {
        updateDiscountsOnSaleItem(saleItem, saleItem.id, saleItemRepository, tx)
      }
    }
  }

  async execute({
    id,
    couponId,
    removeCoupon,
  }: UpdateSaleRequest): Promise<UpdateSaleResponse> {
    const { saleCurrent, user } = await this.initVerify(id)
    let saleUpdate: DetailedSale | undefined
    const getItemsBuild = makeGetItemsBuildService()
    const { saleItemsBuild }: GetItemsBuildResponse =
      await getItemsBuild.execute({
        saleItems: saleCurrent.items,
        unitId: user.unitId,
      })
    const currentSaleItems: ReturnBuildItemData[] = [...saleItemsBuild]
    const changeCoupon = couponId && saleCurrent.coupon?.id !== couponId
    let couponConnect: { connect: { id: string } } | undefined

    if (!changeCoupon && !removeCoupon) {
      throw new Error('No coupon changes')
    }

    if (changeCoupon && !removeCoupon) {
      const { couponIdConnect } = await applyCouponSale(
        currentSaleItems,
        couponId,
        this.couponRepository,
      )
      couponConnect = { connect: { id: couponIdConnect } }
    }

    const totalCurrentSaleItems = calculateTotal(currentSaleItems)

    await prisma.$transaction(async (tx) => {
      await this.updateSaleItems(currentSaleItems, this.saleItemRepository, tx)
      saleUpdate = await this.repository.update(
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

    return { sale: saleUpdate }
  }
}
