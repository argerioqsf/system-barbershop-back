import { SaleRepository, DetailedSale } from '@/repositories/sale-repository'
import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { CashRegisterRepository } from '@/repositories/cash-register-repository'
import { TransactionRepository } from '@/repositories/transaction-repository'
import { OrganizationRepository } from '@/repositories/organization-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { UnitRepository } from '@/repositories/unit-repository'
import { PaymentStatus, TransactionType } from '@prisma/client'
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
    if (!sale) throw new Error('Sale not found')

    if (sale.paymentStatus === paymentStatus) {
      return { sale }
    }

    if (paymentStatus === PaymentStatus.PAID) {
      const user = await this.barberUserRepository.findById(userId)
      const session = await this.cashRegisterRepository.findOpenByUnit(
        user?.unitId as string,
      )
      if (!session) throw new Error('Cash register closed')

      const transaction = await this.transactionRepository.create({
        user: { connect: { id: userId } },
        unit: { connect: { id: user?.unitId } },
        session: { connect: { id: session.id } },
        type: TransactionType.ADDITION,
        description: 'Sale',
        amount: sale.total,
      })

      try {
        const updatedSale = await this.saleRepository.update(saleId, {
          paymentStatus,
          session: { connect: { id: session.id } },
          transaction: { connect: { id: transaction.id } },
        })

        await distributeProfits(updatedSale, user?.organizationId as string, {
          organizationRepository: this.organizationRepository,
          profileRepository: this.profileRepository,
          unitRepository: this.unitRepository,
        })

        return { sale: updatedSale }
      } catch (error) {
        await this.transactionRepository.delete(transaction.id)
        throw error
      }
    }

    const updatedSale = await this.saleRepository.update(saleId, {
      paymentStatus,
    })
    return { sale: updatedSale }
  }
}
