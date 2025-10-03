import { distributeProfits } from '@/services/sale/utils/profit-distribution'
import { DetailedSale } from '@/repositories/sale-repository'
import { OrganizationRepository } from '@/repositories/organization-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { UnitRepository } from '@/repositories/unit-repository'
import { TransactionRepository } from '@/repositories/transaction-repository'
import { AppointmentRepository } from '@/repositories/appointment-repository'
import { BarberServiceRepository } from '@/repositories/barber-service-repository'
import { BarberProductRepository } from '@/repositories/barber-product-repository'
import { AppointmentServiceRepository } from '@/repositories/appointment-service-repository'
import { SaleItemRepository } from '@/repositories/sale-item-repository'
import { Prisma } from '@prisma/client'

interface DistributeParams {
  sale: DetailedSale
  organizationId: string
  userId: string
  sessionId: string
}

export class SaleProfitDistributionService {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly profileRepository: ProfilesRepository,
    private readonly unitRepository: UnitRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly appointmentRepository: AppointmentRepository,
    private readonly barberServiceRepository: BarberServiceRepository,
    private readonly barberProductRepository: BarberProductRepository,
    private readonly appointmentServiceRepository: AppointmentServiceRepository,
    private readonly saleItemRepository: SaleItemRepository,
  ) {}

  async distribute(
    { sale, organizationId, userId, sessionId }: DistributeParams,
    tx?: Prisma.TransactionClient,
  ) {
    sale.sessionId = sessionId

    await distributeProfits(
      sale,
      organizationId,
      userId,
      {
        organizationRepository: this.organizationRepository,
        profileRepository: this.profileRepository,
        unitRepository: this.unitRepository,
        transactionRepository: this.transactionRepository,
        appointmentRepository: this.appointmentRepository,
        barberServiceRepository: this.barberServiceRepository,
        barberProductRepository: this.barberProductRepository,
        appointmentServiceRepository: this.appointmentServiceRepository,
        saleItemRepository: this.saleItemRepository,
      },
      tx,
    )
  }
}
