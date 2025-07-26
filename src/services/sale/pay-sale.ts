import {
  DetailedSale,
  DetailedSaleItem,
  SaleRepository,
} from '@/repositories/sale-repository'
import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { CashRegisterRepository } from '@/repositories/cash-register-repository'
import { TransactionRepository } from '@/repositories/transaction-repository'
import { OrganizationRepository } from '@/repositories/organization-repository'
import {
  ProfilesRepository,
  ResponseFindByUserId,
} from '@/repositories/profiles-repository'
import { UnitRepository } from '@/repositories/unit-repository'
import {
  BarberService,
  PaymentStatus,
  Permission,
  PlanProfileStatus,
  Prisma,
  Profile,
  ProfileBlockedHour,
  ProfileWorkHour,
  Role,
  Unit,
  User,
} from '@prisma/client'
import { SaleNotFoundError } from '@/services/@errors/sale/sale-not-found-error'
import { CashRegisterClosedError } from '@/services/@errors/cash-register/cash-register-closed-error'
import { distributeProfits } from './utils/profit-distribution'
import { calculateBarberCommission } from './utils/barber-commission'
import { SetSaleStatusRequest, SetSaleStatusResponse } from './types'
import { ProfileNotFoundError } from '../@errors/profile/profile-not-found-error'
import { BarberServiceRepository } from '@/repositories/barber-service-repository'
import { BarberProductRepository } from '@/repositories/barber-product-repository'
import { AppointmentRepository } from '@/repositories/appointment-repository'
import { AppointmentServiceRepository } from '@/repositories/appointment-service-repository'
import { SaleItemRepository } from '@/repositories/sale-item-repository'
import { PlanProfileRepository } from '@/repositories/plan-profile-repository'
import { PlanAlreadyLinkedError } from '../@errors/plan/plan-already-linked-error'
import { UserNotFoundError } from '../@errors/user/user-not-found-error'
import { prisma } from '@/lib/prisma'
import { updateCouponsStock, updateProductsStock } from './utils/sale'
import { CouponRepository } from '@/repositories/coupon-repository'
import { ProductRepository } from '@/repositories/product-repository'

type FullUser =
  | (Omit<User, 'password'> & {
      profile:
        | (Profile & {
            role: Role
            permissions: Permission[]
            workHours: ProfileWorkHour[]
            blockedHours: ProfileBlockedHour[]
            barberServices: BarberService[]
          })
        | null
      unit: Unit | null
    })
  | null
export class PaySaleService {
  constructor(
    private saleRepository: SaleRepository,
    private barberUserRepository: BarberUsersRepository,
    private barberServiceRepository: BarberServiceRepository,
    private barberProductRepository: BarberProductRepository,
    private appointmentRepository: AppointmentRepository,
    private cashRegisterRepository: CashRegisterRepository,
    private transactionRepository: TransactionRepository,
    private organizationRepository: OrganizationRepository,
    private profileRepository: ProfilesRepository,
    private unitRepository: UnitRepository,
    private appointmentServiceRepository: AppointmentServiceRepository,
    private saleItemRepository: SaleItemRepository,
    private planProfileRepository: PlanProfileRepository,
    private couponRepository: CouponRepository,
    private productRepository: ProductRepository,
  ) {}

  private async verifyCommissionUser(
    item: DetailedSaleItem,
    barber: FullUser,
  ): Promise<number | undefined> {
    let commission: number | undefined
    if (!barber?.profile) throw new ProfileNotFoundError()
    if (item.appointmentId && item.appointment) {
      commission = undefined
    } else if (item.serviceId && item.service) {
      const relation = await this.barberServiceRepository.findByProfileService(
        barber.profile.id,
        item.serviceId,
      )
      commission = calculateBarberCommission(
        item.service,
        barber.profile,
        relation,
      )
    } else if (item.productId && item.product) {
      const relation = await this.barberProductRepository.findByProfileProduct(
        barber.profile.id,
        item.productId,
      )
      commission = calculateBarberCommission(
        item.product,
        barber.profile,
        relation,
      )
    }
    return commission
  }

  private async verifyAndCreatePlanProfile(
    item: DetailedSaleItem,
    clientProfileId: string,
    tx?: Prisma.TransactionClient,
  ) {
    if (item.planId) {
      const where: Prisma.PlanProfileWhereInput = {
        planId: item.planId,
        profileId: clientProfileId,
        NOT: { status: 'CANCELED' },
      }
      const existing = await this.planProfileRepository.findMany(where)
      if (existing.length > 0) {
        throw new PlanAlreadyLinkedError()
      }
      const currentDate = new Date()
      await this.planProfileRepository.create(
        {
          saleItemId: item.id,
          planId: item.planId,
          profileId: clientProfileId,
          planStartDate: currentDate,
          dueDateDebt: currentDate.getDate(),
          status: PlanProfileStatus.PAID,
          debts: [
            {
              value: item.price,
              status: PaymentStatus.PAID,
              planId: item.planId,
              paymentDate: currentDate,
            },
          ],
        },
        tx,
      )
    }
  }

  private async verifyAndReturnSale(saleId: string): Promise<DetailedSale> {
    const sale = await this.saleRepository.findById(saleId)
    if (!sale) throw new SaleNotFoundError()

    if (sale.paymentStatus === PaymentStatus.PAID) {
      throw new Error('Sale has already been paid')
    }
    return sale
  }

  private async setBarberPercentageInSaleItems(sale: DetailedSale) {
    for (const item of sale.items) {
      let barberId = item.barberId
      if (item.appointment) {
        barberId = item.appointment.barberId
      }
      if (!barberId) continue
      const barber = await this.barberUserRepository.findById(barberId)
      if (!barber?.profile) throw new ProfileNotFoundError()

      const commission: number | undefined = await this.verifyCommissionUser(
        item,
        barber,
      )

      if (commission !== undefined) {
        item.porcentagemBarbeiro = commission
      }
    }
  }

  private async addAndUpdateRemainingRelationships(
    saleItems: DetailedSaleItem[],
    clientProfile: NonNullable<ResponseFindByUserId>,
    tx: Prisma.TransactionClient,
  ) {
    for (const item of saleItems) {
      if (item.appointmentId) {
        await this.appointmentRepository.update(
          item.appointmentId,
          {
            status: 'CONCLUDED',
          },
          tx,
        )
      }
      if (item.plan) {
        await this.verifyAndCreatePlanProfile(item, clientProfile.id, tx)
      }
    }
  }

  private async updateStockCoupons(
    updatedSale: DetailedSale,
    tx: Prisma.TransactionClient,
  ) {
    const itemsCouponsToUpdate = updatedSale.items.filter(
      (item) => item.couponId,
    )
    if (updatedSale.couponId) {
      itemsCouponsToUpdate.push({
        couponId: updatedSale.couponId,
        price: updatedSale.total,
      } as DetailedSaleItem)
    }
    await updateCouponsStock(
      this.couponRepository,
      itemsCouponsToUpdate,
      'decrement',
      tx,
    )
  }

  private async updateStockProducts(
    updatedSale: DetailedSale,
    tx: Prisma.TransactionClient,
  ) {
    const productsToUpdate = updatedSale.items
      .filter((item) => item.product)
      .map((saleItem) => ({
        id: saleItem.productId as string,
        quantity: saleItem.quantity,
      }))
    await updateProductsStock(
      this.productRepository,
      productsToUpdate,
      'decrement',
      tx,
    )
  }

  private async getAndVerifyUserWhoIsChangingSale(userId: string) {
    const user = await this.barberUserRepository.findById(userId)
    if (!user) throw new UserNotFoundError()
    return user
  }

  private async getAndVerifySession(unitId: string) {
    const session = await this.cashRegisterRepository.findOpenByUnit(unitId)
    if (!session) throw new CashRegisterClosedError()
    return session
  }

  private async getAndVerifySaleClient(clientId: string) {
    const clientProfile = await this.profileRepository.findByUserId(clientId)
    if (!clientProfile) throw new ProfileNotFoundError()
    return clientProfile
  }

  private async handleDistributeProfits(
    sale: DetailedSale,
    organizationId: string,
    userId: string,
    sessionId: string,
  ) {
    sale.sessionId = sessionId
    await distributeProfits(sale, organizationId, userId, {
      organizationRepository: this.organizationRepository,
      profileRepository: this.profileRepository,
      unitRepository: this.unitRepository,
      transactionRepository: this.transactionRepository,
      appointmentRepository: this.appointmentRepository,
      barberServiceRepository: this.barberServiceRepository,
      barberProductRepository: this.barberProductRepository,
      appointmentServiceRepository: this.appointmentServiceRepository,
      saleItemRepository: this.saleItemRepository,
    })
  }

  private async updatePaymentStatusAndAddSession(
    saleId: string,
    paymentStatus: PaymentStatus,
    sessionId: string,
    tx?: Prisma.TransactionClient,
  ) {
    return await this.saleRepository.update(
      saleId,
      {
        paymentStatus,
        session: { connect: { id: sessionId } },
      },
      tx,
    )
  }

  async execute({
    saleId,
    userId,
  }: SetSaleStatusRequest): Promise<SetSaleStatusResponse> {
    const sale = await this.verifyAndReturnSale(saleId)
    const user = await this.getAndVerifyUserWhoIsChangingSale(userId)
    const session = await this.getAndVerifySession(user.unitId)
    const clientProfile = await this.getAndVerifySaleClient(sale.clientId)

    this.setBarberPercentageInSaleItems(sale)

    let updatedSale: DetailedSale | undefined
    await prisma.$transaction(async (tx) => {
      await this.addAndUpdateRemainingRelationships(
        sale.items,
        clientProfile,
        tx,
      )
      await this.handleDistributeProfits(
        sale,
        user.organizationId,
        userId,
        session.id,
      )
      await this.updateStockCoupons(sale, tx)
      await this.updateStockProducts(sale, tx)
      updatedSale = await this.updatePaymentStatusAndAddSession(
        saleId,
        PaymentStatus.PAID,
        session.id,
        tx,
      )
    })

    if (!updatedSale) {
      throw new Error('Error paying the sale')
    }

    return { sale: updatedSale }
  }
}
