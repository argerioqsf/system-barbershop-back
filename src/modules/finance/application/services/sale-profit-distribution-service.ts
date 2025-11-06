import { DetailedSale } from '@/repositories/sale-repository'
import { TransactionRepository } from '@/repositories/transaction-repository'
import { BarberServiceRepository } from '@/repositories/barber-service-repository'
import { BarberProductRepository } from '@/repositories/barber-product-repository'
import { Prisma } from '@prisma/client'
import {
  ProfitDistributionService,
  SaleForDistribution,
} from '@/modules/sale/domain/services/profit-distribution'
import { TransactionReason } from '@/modules/finance/domain/entities/transaction'
import { SaleItemRepository } from '@/repositories/sale-item-repository'
import { AppointmentServiceRepository } from '@/repositories/appointment-service-repository'

interface DistributeParams {
  sale: DetailedSale
  userId: string
  sessionId: string
}

export class SaleProfitDistributionService {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly barberServiceRepository: BarberServiceRepository,
    private readonly barberProductRepository: BarberProductRepository,
    private readonly saleItemRepository: SaleItemRepository,
    private readonly appointmentServiceRepository: AppointmentServiceRepository,
    private readonly profitDistributionService: ProfitDistributionService,
  ) {}

  private async hydrateSale(sale: DetailedSale): Promise<SaleForDistribution> {
    const hydratedItems = await Promise.all(
      sale.items.map(async (item) => {
        if (!item.barberId || !item.barber?.profile) return item

        let relation = null
        if (item.serviceId) {
          relation = await this.barberServiceRepository.findByProfileService(
            item.barber.profile.id,
            item.serviceId,
          )
        }

        if (item.productId) {
          relation = await this.barberProductRepository.findByProfileProduct(
            item.barber.profile.id,
            item.productId,
          )
        }

        return { ...item, relation }
      }),
    )

    return { ...sale, items: hydratedItems }
  }

  async distribute(
    { sale, userId, sessionId }: DistributeParams,
    tx: Prisma.TransactionClient,
  ) {
    const hydratedSale = await this.hydrateSale(sale)

    const { ownerShare, barberShares } =
      this.profitDistributionService.execute(hydratedSale)

    // Create transaction for owner's share
    if (ownerShare.isPositive()) {
      await this.transactionRepository.create(
        {
          amount: ownerShare.toNumber(),
          type: 'ADDITION',
          reason: TransactionReason.ADD_COMMISSION,
          description: `Comissão da unidade referente à venda #${sale.id.substring(
            0,
            8,
          )}`,
          unit: { connect: { id: sale.unitId } },
          user: { connect: { id: userId } },
          sale: { connect: { id: sale.id } },
          session: { connect: { id: sessionId } },
        },
        tx,
      )
    }

    // Create transactions for barbers' shares
    for (const share of barberShares) {
      await this.transactionRepository.create(
        {
          amount: share.amount.toNumber(),
          type: 'ADDITION',
          reason: TransactionReason.ADD_COMMISSION,
          description: `Comissão de barbeiro referente à venda #${sale.id.substring(
            0,
            8,
          )}`,
          unit: { connect: { id: sale.unitId } },
          user: { connect: { id: userId } },
          affectedUser: { connect: { id: share.barberId } },
          sale: { connect: { id: sale.id } },
          session: { connect: { id: sessionId } },
        },
        tx,
      )

      // Update sale item with commission percentage
      if (share.appointmentServiceId) {
        await this.appointmentServiceRepository.update(
          share.appointmentServiceId,
          {
            commissionPercentage: share.commissionPercentage.toNumber(),
          },
          tx,
        )
      } else {
        await this.saleItemRepository.update(
          share.saleItemId,
          {
            porcentagemBarbeiro: share.commissionPercentage.toNumber(),
          },
          tx,
        )
      }
    }
  }
}
