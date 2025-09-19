import { SaleRepository, DetailedSale } from '@/repositories/sale-repository'
import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import {
  ProfilesRepository,
  ResponseFindByUserId,
} from '@/repositories/profiles-repository'
import { SaleItemRepository } from '@/repositories/sale-item-repository'
import { PlanRepository } from '@/repositories/plan-repository'
import { PlanProfileRepository } from '@/repositories/plan-profile-repository'
import { UpdateSaleRequest } from './types'
import { PaymentStatus, Prisma } from '@prisma/client'
import { CannotEditPaidSaleError } from '../@errors/sale/cannot-edit-paid-sale-error'
import { applyPlanDiscounts } from './utils/plan'
import {
  buildItemData,
  ReturnBuildItemData,
  SaleItemBuildItem,
  updateDiscountsOnSaleItem,
} from './utils/item'
import { calculateTotal } from './utils/sale'
import { ProfileNotFoundError } from '../@errors/profile/profile-not-found-error'
import { prisma } from '@/lib/prisma'
import { ServiceRepository } from '@/repositories/service-repository'
import { ProductRepository } from '@/repositories/product-repository'
import { AppointmentRepository } from '@/repositories/appointment-repository'
import { CouponRepository } from '@/repositories/coupon-repository'
import { makeGetItemBuildService } from '../@factories/sale/make-get-item-build'

interface UpdateSaleResponse {
  sale?: DetailedSale
}

export class UpdateClientSaleService {
  constructor(
    private repository: SaleRepository,
    private profileRepository: ProfilesRepository,
    private saleItemRepository: SaleItemRepository,
    private planRepository: PlanRepository,
    private planProfileRepository: PlanProfileRepository,
    private serviceRepository: ServiceRepository,
    private productRepository: ProductRepository,
    private appointmentRepository: AppointmentRepository,
    private couponRepository: CouponRepository,
    private barberUserRepository: BarberUsersRepository,
  ) {}

  private async initVerify(id: string): Promise<{
    saleCurrent: DetailedSale
  }> {
    if (!id) throw new Error('Sale ID is required')

    const saleCurrent = await this.repository.findById(id)
    if (!saleCurrent) throw new Error('Sale not found')
    if (saleCurrent.paymentStatus === PaymentStatus.PAID) {
      throw new CannotEditPaidSaleError()
    }

    return { saleCurrent }
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
    clientId,
  }: UpdateSaleRequest): Promise<UpdateSaleResponse> {
    const { saleCurrent } = await this.initVerify(id)
    const hasClientChange = clientId && clientId !== saleCurrent.clientId
    if (!hasClientChange) throw new Error('No changes to the client')

    let saleUpdate: DetailedSale | undefined
    const newClientProfile: ResponseFindByUserId | null =
      await this.profileRepository.findByUserId(clientId)
    if (!newClientProfile) throw new ProfileNotFoundError()
    const getItemsBuild = makeGetItemBuildService()
    const saleItemsBuild = await getItemsBuild.execute({
      saleItems: saleCurrent.items,
      unitId: saleCurrent.unitId,
    })
    const currentSaleItems: ReturnBuildItemData[] = saleItemsBuild

    await applyPlanDiscounts(
      currentSaleItems,
      newClientProfile.userId,
      this.planProfileRepository,
      this.planRepository,
    )

    const totalCurrentSaleItems = calculateTotal(currentSaleItems)

    await prisma.$transaction(async (tx) => {
      await this.updateSaleItems(currentSaleItems, this.saleItemRepository, tx)
      saleUpdate = await this.repository.update(
        id,
        {
          ...(totalCurrentSaleItems !== saleCurrent.total
            ? { total: totalCurrentSaleItems }
            : {}),
          client: {
            connect: { id: clientId },
          },
        },
        tx,
      )
    })

    return { sale: saleUpdate }
  }
}
