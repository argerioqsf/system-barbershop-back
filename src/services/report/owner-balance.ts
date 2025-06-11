import { SaleRepository } from '@/repositories/sale-repository'
import { TransactionRepository } from '@/repositories/transaction-repository'
import { BarberUsersRepository } from '@/repositories/barber-users-repository'

interface OwnerBalanceRequest {
  ownerId: string
}

interface OwnerBalanceResponse {
  balance: number
}

export class OwnerBalanceService {
  constructor(
    private saleRepository: SaleRepository,
    private transactionRepository: TransactionRepository,
    private userRepository: BarberUsersRepository,
  ) {}

  async execute({
    ownerId,
  }: OwnerBalanceRequest): Promise<OwnerBalanceResponse> {
    const owner = await this.userRepository.findById(ownerId)
    if (!owner) throw new Error('Owner not found')
    const orgId = owner.organizationId
    const sales = await this.saleRepository.findMany({
      unit: { organizationId: orgId },
    })

    const salesTotal = sales.reduce((acc, sale) => {
      const totals = sale.items.reduce(
        (t, item) => {
          const value = item.service.price * item.quantity
          if (item.service.isProduct) t.product += value
          else t.service += value
          t.total += value
          return t
        },
        { service: 0, product: 0, total: 0 },
      )

      let serviceShare = totals.service
      let productShare = totals.product

      if (sale.coupon) {
        if (sale.coupon.discountType === 'PERCENTAGE') {
          serviceShare -= (serviceShare * sale.coupon.discount) / 100
          productShare -= (productShare * sale.coupon.discount) / 100
        } else {
          const totalBefore = totals.service + totals.product
          const serviceDiscount =
            (totals.service / totalBefore) * sale.coupon.discount
          const productDiscount =
            (totals.product / totalBefore) * sale.coupon.discount
          serviceShare -= serviceDiscount
          productShare -= productDiscount
        }
      }

      const barberPercentage = sale.user.profile?.commissionPercentage ?? 100
      const barberShare = serviceShare * (barberPercentage / 100)
      const ownerShare = serviceShare - barberShare + productShare
      return acc + ownerShare
    }, 0)

    const transactions =
      await this.transactionRepository.findManyByUser(ownerId)
    const additions = transactions
      .filter((t) => t.type === 'ADDITION')
      .reduce((acc, t) => acc + t.amount, 0)
    const withdrawals = transactions
      .filter((t) => t.type === 'WITHDRAWAL')
      .reduce((acc, t) => acc + t.amount, 0)

    const balance = Number((salesTotal + additions - withdrawals).toFixed(2))
    return { balance }
  }
}
