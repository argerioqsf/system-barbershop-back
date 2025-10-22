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
  PaymentMethod,
  PaymentStatus,
  PlanProfileStatus,
  Prisma,
  SaleStatus,
} from '@prisma/client'
import { SaleNotFoundError } from '@/services/@errors/sale/sale-not-found-error'
import { CashRegisterClosedError } from '@/services/@errors/cash-register/cash-register-closed-error'
import {
  SetSaleStatusRequest,
  SetSaleStatusResponse,
} from '@/modules/sale/application/dto/sale'
import { ProfileNotFoundError } from '@/services/@errors/profile/profile-not-found-error'
import { BarberServiceRepository } from '@/repositories/barber-service-repository'
import { BarberProductRepository } from '@/repositories/barber-product-repository'
import { AppointmentRepository } from '@/repositories/appointment-repository'
import { AppointmentServiceRepository } from '@/repositories/appointment-service-repository'
import { SaleItemRepository } from '@/repositories/sale-item-repository'
import { PlanProfileRepository } from '@/repositories/plan-profile-repository'
import { PlanAlreadyLinkedError } from '@/services/@errors/plan/plan-already-linked-error'
import { UserNotFoundError } from '@/services/@errors/user/user-not-found-error'
import {
  updateCouponsStock,
  updateProductsStock,
} from '@/services/sale/utils/sale'
import { CouponRepository } from '@/repositories/coupon-repository'
import { ProductRepository } from '@/repositories/product-repository'
import { TypeRecurrenceRepository } from '@/repositories/type-recurrence-repository'
import { calculateNextDueDate } from '@/services/plan/utils/helpers'
import { calculateRealValueSaleItem } from '@/services/sale/utils/item'
import { ProductToUpdate } from '@/modules/sale/application/dto/sale-item-dto'
import { SaleCommissionService } from '@/modules/finance/application/services/sale-commission-service'
import { SaleProfitDistributionService } from '@/modules/finance/application/services/sale-profit-distribution-service'
import { SaleTelemetry } from '@/modules/sale/application/ports/sale-telemetry'
import { TransactionRunner } from '@/core/application/ports/transaction-runner'
import {
  TransactionRunnerLike,
  normalizeTransactionRunner,
} from '@/core/application/utils/transaction-runner'
import { defaultTransactionRunner } from '@/infra/prisma/transaction-runner'
import { logger } from '@/lib/logger'
import { UpdateCashRegisterFinalAmountService } from '@/services/cash-register/update-cash-register-final-amount'

export class PaySaleUseCase {
  private readonly transactionRunner: TransactionRunner

  constructor(
    private readonly saleRepository: SaleRepository,
    private readonly barberUserRepository: BarberUsersRepository,
    private readonly barberServiceRepository: BarberServiceRepository,
    private readonly barberProductRepository: BarberProductRepository,
    private readonly appointmentRepository: AppointmentRepository,
    private readonly cashRegisterRepository: CashRegisterRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly organizationRepository: OrganizationRepository,
    private readonly profileRepository: ProfilesRepository,
    private readonly unitRepository: UnitRepository,
    private readonly appointmentServiceRepository: AppointmentServiceRepository,
    private readonly saleItemRepository: SaleItemRepository,
    private readonly planProfileRepository: PlanProfileRepository,
    private readonly couponRepository: CouponRepository,
    private readonly productRepository: ProductRepository,
    private readonly typeRecurrenceRepository: TypeRecurrenceRepository,
    private readonly saleCommissionService: SaleCommissionService,
    private readonly saleProfitDistributionService: SaleProfitDistributionService,
    transactionRunner?: TransactionRunnerLike,
    private readonly telemetry?: SaleTelemetry,
  ) {
    this.transactionRunner = normalizeTransactionRunner(
      transactionRunner,
      defaultTransactionRunner,
    )
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
        NOT: {
          status: {
            in: [PlanProfileStatus.CANCELED_EXPIRED],
          },
        },
      }
      const existing = await this.planProfileRepository.findMany(where, tx)
      if (existing.length > 0) {
        throw new PlanAlreadyLinkedError()
      }
      const currentDate = new Date()
      const dueDayDebt = currentDate.getDate()
      if (!item.plan) throw new Error('Plan not found')

      const recurrence = await this.typeRecurrenceRepository.findById(
        item.plan.typeRecurrenceId,
      )
      if (!recurrence) throw new Error('Recurrence not found')

      const dueDate = calculateNextDueDate(currentDate, recurrence, dueDayDebt)
      const realValueItem = calculateRealValueSaleItem(
        item.price,
        item.discounts,
      )
      await this.planProfileRepository.create(
        {
          saleItemId: item.id,
          planId: item.planId,
          profileId: clientProfileId,
          planStartDate: currentDate,
          dueDayDebt,
          status: PlanProfileStatus.PAID,
          debts: [
            {
              value: realValueItem,
              status: PaymentStatus.PAID,
              planId: item.planId,
              paymentDate: currentDate,
              dueDate,
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
    const productsToUpdate: ProductToUpdate[] = updatedSale.items
      .filter((item) => item.product)
      .map((saleItem) => ({
        id: saleItem.productId as string,
        quantity: saleItem.quantity,
        saleItemId: saleItem.id,
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

  private async distributeProfitsAndCommissions(
    sale: DetailedSale,
    userId: string,
    organizationId: string,
    sessionId: string,
    tx?: Prisma.TransactionClient,
  ) {
    await this.saleCommissionService.applyCommissionPercentages(sale)
    logger.debug('sale with commissions', { items: sale.items })
    await this.saleProfitDistributionService.distribute(
      {
        sale,
        organizationId,
        userId,
        sessionId,
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

    const updateCashRegisterFinalAmount =
      new UpdateCashRegisterFinalAmountService(this.cashRegisterRepository)

    if (sale.method === PaymentMethod.EXEMPT && sale.total > 0) {
      throw new Error('invalid payment method for this sale')
    }

    const run = async (tx: Prisma.TransactionClient) => {
      const updatedSale = await this.saleRepository.update(
        saleId,
        {
          paymentStatus: PaymentStatus.PAID,
          status: SaleStatus.COMPLETED,
          completionDate: new Date(),
          session: { connect: { id: session.id } },
        },
        tx,
      )

      await this.addAndUpdateRemainingRelationships(
        updatedSale.items,
        clientProfile,
        tx,
      )

      await this.updateStockCoupons(updatedSale, tx)
      await this.updateStockProducts(updatedSale, tx)

      await this.distributeProfitsAndCommissions(
        updatedSale,
        userId,
        user.organizationId,
        session.id,
        tx,
      )

      await updateCashRegisterFinalAmount.execute(
        { sessionId: session.id, amount: updatedSale.total },
        tx,
      )

      return updatedSale
    }
    // TODO(opção A): reduzir o trabalho dentro da transação. Mover a
    // distribuição de comissões/lucros para fora do callback e executar
    // após o commit, mantendo na transação apenas as operações estritamente
    // necessárias (pagar a venda, concluir agendamentos, criar PlanProfile
    // e atualizar estoques). Avaliar compensações/retentativas.
    // MIGRATION-TODO: alinhar este caso de uso ao padrão UseCaseCtx quando o módulo Finance for migrado
    const updatedSale = await this.transactionRunner.run((tx) => run(tx))

    if (updatedSale) {
      this.telemetry?.record({
        operation: 'sale.paid',
        saleId: updatedSale.id,
        actorId: userId,
        metadata: {
          sessionId: session.id,
          previousStatus: sale.paymentStatus,
        },
      })
    }

    return { sale: updatedSale }
  }
}
