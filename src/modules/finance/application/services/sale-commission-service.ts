import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { DetailedSale, DetailedSaleItem } from '@/repositories/sale-repository'
import { BarberServiceRepository } from '@/repositories/barber-service-repository'
import { BarberProductRepository } from '@/repositories/barber-product-repository'
import { ProfileNotFoundError } from '@/services/@errors/profile/profile-not-found-error'
import { CommissionResolutionService } from '@/modules/sale/domain/services/commission-resolution-service'

export class SaleCommissionService {
  constructor(
    private readonly barberUsersRepository: BarberUsersRepository,
    private readonly barberServiceRepository: BarberServiceRepository,
    private readonly barberProductRepository: BarberProductRepository,
    private readonly commissionResolutionService: CommissionResolutionService,
  ) {}

  async applyCommissionPercentages(sale: DetailedSale): Promise<void> {
    for (const item of sale.items) {
      const barberId = this.resolveBarberId(item)
      if (!barberId) continue

      const commission = await this.computeCommission(item, barberId)
      if (commission !== undefined) {
        item.porcentagemBarbeiro = commission
      }
    }
  }

  private resolveBarberId(item: DetailedSaleItem): string | null | undefined {
    if (item.appointment) {
      return item.appointment.barberId
    }

    return item.barberId
  }

  private async computeCommission(
    item: DetailedSaleItem,
    barberId: string,
  ): Promise<number | undefined> {
    const barber = await this.barberUsersRepository.findById(barberId)
    if (!barber?.profile) {
      throw new ProfileNotFoundError()
    }

    if (item.appointmentId && item.appointment) {
      return undefined
    }

    if (item.serviceId && item.service) {
      const relation = await this.barberServiceRepository.findByProfileService(
        barber.profile.id,
        item.serviceId,
      )

      return this.commissionResolutionService
        .getPercentage(item.service, barber.profile, relation)
        .toNumber()
    }

    if (item.productId && item.product) {
      const relation = await this.barberProductRepository.findByProfileProduct(
        barber.profile.id,
        item.productId,
      )

      return this.commissionResolutionService
        .getPercentage(item.product, barber.profile, relation)
        .toNumber()
    }

    return undefined
  }
}
