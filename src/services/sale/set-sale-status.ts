import { SaleRepository, DetailedSale } from '@/repositories/sale-repository'
import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { CashRegisterRepository } from '@/repositories/cash-register-repository'
import { TransactionRepository } from '@/repositories/transaction-repository'
import { OrganizationRepository } from '@/repositories/organization-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { UnitRepository } from '@/repositories/unit-repository'
import { PaymentStatus, TransactionType } from '@prisma/client'

interface SetSaleStatusRequest {
  saleId: string
  userId: string
  paymentStatus: PaymentStatus
}

interface SetSaleStatusResponse {
  sale: DetailedSale
}

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

        const org = await this.organizationRepository.findById(
          user?.organizationId as string,
        )
        if (!org) throw new Error('Org not found')
        const barberTotals: Record<string, number> = {}
        let ownerShare = 0
        for (const item of updatedSale.items) {
          const value = item.price ?? 0
          if (item.product) {
            ownerShare += value
          } else if (item.barberId) {
            const perc = item.porcentagemBarbeiro ?? 100
            const valueBarber = (value * perc) / 100
            barberTotals[item.barberId] =
              (barberTotals[item.barberId] || 0) + valueBarber
            ownerShare += value - valueBarber
          } else {
            ownerShare += value
          }
        }
        for (const [barberId, amount] of Object.entries(barberTotals)) {
          const userBarber = updatedSale.items.find(
            (item) => item.barber?.id === barberId,
          )
          if (!userBarber) throw new Error('Barber not found')
          if (
            userBarber &&
            userBarber.barber &&
            userBarber.barber.profile &&
            userBarber.barber.profile.totalBalance < 0
          ) {
            const balanceBarber = userBarber.barber.profile.totalBalance
            const valueCalculated = balanceBarber + amount
            if (valueCalculated <= 0) {
              await this.unitRepository.incrementBalance(
                updatedSale.unitId,
                amount,
              )
            } else {
              await this.unitRepository.incrementBalance(
                updatedSale.unitId,
                balanceBarber * -1,
              )
              await this.organizationRepository.incrementBalance(
                org.id,
                balanceBarber * -1,
              )
            }
          }
          await this.profileRepository.incrementBalance(barberId, amount)
        }
        await this.unitRepository.incrementBalance(
          updatedSale.unitId,
          ownerShare,
        )
        await this.organizationRepository.incrementBalance(org.id, ownerShare)

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
