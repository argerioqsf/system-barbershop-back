import { SaleRepository, DetailedSale } from '@/repositories/sale-repository'
import { ServiceRepository } from '@/repositories/service-repository'
import { ProductRepository } from '@/repositories/product-repository'
import { AppointmentRepository } from '@/repositories/appointment-repository'
import { CouponRepository } from '@/repositories/coupon-repository'
import {
  BarberUsersRepository,
  UserFindById,
} from '@/repositories/barber-users-repository'
import { SaleItemRepository } from '@/repositories/sale-item-repository'
import { PlanRepository } from '@/repositories/plan-repository'
import { PlanProfileRepository } from '@/repositories/plan-profile-repository'
import { UpdateSaleRequest, CreateSaleItem } from './types'
import { PaymentStatus, Prisma } from '@prisma/client'
import { CannotEditPaidSaleError } from '../@errors/sale/cannot-edit-paid-sale-error'
import { applyCouponSale } from './utils/coupon'
import {
  buildItemData,
  ReturnBuildItemData,
  updateDiscountsOnSaleItem,
} from './utils/item'
import { calculateTotal } from './utils/sale'
import { prisma } from '@/lib/prisma'
import { applyPlanDiscounts } from './utils/plan'

interface UpdateSaleResponse {
  sale?: DetailedSale
}

type ProductsToUpdate = {
  id: string
  quantity: number
}

type GetItemsBuildReturn = {
  saleItemsBuild: ReturnBuildItemData[]
  newAppointmentsToLink: string[]
  productsToUpdate: ProductsToUpdate[]
}

export class UpdateCouponSaleService {
  constructor(
    private repository: SaleRepository,
    private serviceRepository: ServiceRepository,
    private productRepository: ProductRepository,
    private appointmentRepository: AppointmentRepository,
    private couponRepository: CouponRepository,
    private barberUserRepository: BarberUsersRepository,
    private saleItemRepository: SaleItemRepository,
    private planRepository: PlanRepository,
    private planProfileRepository: PlanProfileRepository,
  ) {}

  private async getItemsBuild(
    saleItems: CreateSaleItem[],
    unitId: string,
  ): Promise<GetItemsBuildReturn> {
    const saleItemsBuild: ReturnBuildItemData[] = []
    const newAppointmentsToLink: string[] = []
    const productsToUpdate: ProductsToUpdate[] = []
    for (const saleItem of saleItems) {
      const temp = await buildItemData({
        saleItem,
        serviceRepository: this.serviceRepository,
        productRepository: this.productRepository,
        appointmentRepository: this.appointmentRepository,
        couponRepository: this.couponRepository,
        userUnitId: unitId,
        productsToUpdate,
        barberUserRepository: this.barberUserRepository,
        planRepository: this.planRepository,
      })
      saleItemsBuild.push(temp)
      if (saleItem.appointmentId)
        newAppointmentsToLink.push(saleItem.appointmentId)
    }
    return { saleItemsBuild, newAppointmentsToLink, productsToUpdate }
  }

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
    const { saleItemsBuild }: GetItemsBuildReturn = await this.getItemsBuild(
      saleCurrent.items,
      user.unitId,
    )
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
      await applyPlanDiscounts(
        currentSaleItems,
        saleCurrent.clientId,
        this.planProfileRepository,
        this.planRepository,
      )
      couponConnect = { connect: { id: couponIdConnect } }
    }

    if (removeCoupon) {
      await applyPlanDiscounts(
        currentSaleItems,
        saleCurrent.clientId,
        this.planProfileRepository,
        this.planRepository,
      )
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
