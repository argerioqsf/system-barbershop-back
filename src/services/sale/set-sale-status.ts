import { SaleRepository } from '@/repositories/sale-repository'
import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { CashRegisterRepository } from '@/repositories/cash-register-repository'
import { TransactionRepository } from '@/repositories/transaction-repository'
import { OrganizationRepository } from '@/repositories/organization-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { UnitRepository } from '@/repositories/unit-repository'
import { PaymentStatus } from '@prisma/client'
import { SaleNotFoundError } from '@/services/@errors/sale/sale-not-found-error'
import { CashRegisterClosedError } from '@/services/@errors/cash-register/cash-register-closed-error'
import { distributeProfits } from './utils/profit-distribution'
import { calculateBarberCommission } from './utils/barber-commission'
import { SetSaleStatusRequest, SetSaleStatusResponse } from './types'
import { ProfileNotFoundError } from '../@errors/profile/profile-not-found-error'
import { BarberServiceRepository } from '@/repositories/barber-service-repository'
import { BarberProductRepository } from '@/repositories/barber-product-repository'

export class SetSaleStatusService {
  constructor(
    private saleRepository: SaleRepository,
    private barberUserRepository: BarberUsersRepository,
    private barberServiceRepository: BarberServiceRepository,
    private barberProductRepository: BarberProductRepository,
    private cashRegisterRepository: CashRegisterRepository,
    private transactionRepository: TransactionRepository,
    private organizationRepository: OrganizationRepository,
    private profileRepository: ProfilesRepository,
    private unitRepository: UnitRepository,
  ) {}

  async execute({
    saleId,
    userId,
    paymentStatus,
  }: SetSaleStatusRequest): Promise<SetSaleStatusResponse> {
    const sale = await this.saleRepository.findById(saleId)
    if (!sale) throw new SaleNotFoundError()

    if (sale.paymentStatus === paymentStatus) {
      return { sale }
    }

    if (paymentStatus === PaymentStatus.PAID) {
      const user = await this.barberUserRepository.findById(userId)
      const session = await this.cashRegisterRepository.findOpenByUnit(
        user?.unitId as string,
      )
      if (!session) throw new CashRegisterClosedError()

      for (const item of sale.items) {
        if (!item.barberId) continue
        const barber = await this.barberUserRepository.findById(item.barberId)
        if (!barber?.profile) throw new ProfileNotFoundError()
        let commission: number | undefined
        if (item.serviceId && item.service) {
          const relation =
            await this.barberServiceRepository.findByProfileService(
              barber.profile.id,
              item.serviceId,
            )
          commission = calculateBarberCommission(
            item.service,
            barber.profile,
            relation,
          )
        } else if (item.productId && item.product) {
          const relation =
            await this.barberProductRepository.findByProfileProduct(
              barber.profile.id,
              item.productId,
            )
          commission = calculateBarberCommission(
            item.product,
            barber.profile,
            relation,
          )
        }
        if (commission !== undefined) {
          item.porcentagemBarbeiro = commission
        }
      }

      const updatedSale = await this.saleRepository.update(saleId, {
        paymentStatus,
        session: { connect: { id: session.id } },
      })

      const { transactions } = await distributeProfits(
        updatedSale,
        user?.organizationId as string,
        userId,
        {
          organizationRepository: this.organizationRepository,
          profileRepository: this.profileRepository,
          unitRepository: this.unitRepository,
          transactionRepository: this.transactionRepository,
        },
      )

      updatedSale.transactions = [...transactions]

      return { sale: updatedSale }
    }

    const updatedSale = await this.saleRepository.update(saleId, {
      paymentStatus,
    })
    return { sale: updatedSale }
  }
}
