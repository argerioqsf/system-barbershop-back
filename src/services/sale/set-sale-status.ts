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
import { distributeProfits } from './profit-distribution'
import { SetSaleStatusRequest, SetSaleStatusResponse } from './types'

export class SetSaleStatusService {
  constructor(
    private saleRepository: SaleRepository,
    private barberUserRepository: BarberUsersRepository,
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
