import { TransactionRepository } from '@/repositories/transaction-repository'
import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { OwnerNotFoundError } from '../@errors/owner-not-found-error'

interface OwnerBalanceRequest {
  ownerId: string
}

interface HistorySales {
  valueService: number
  percentage: number
  valueOwner: number
  coupon?: string
  nameService: string
  quantity: number
}

interface OwnerBalanceResponse {
  balance: number
  historySales: HistorySales[]
}

export class OwnerBalanceService {
  constructor(
    private transactionRepository: TransactionRepository,
    private userRepository: BarberUsersRepository,
  ) {}

  async execute({
    ownerId,
  }: OwnerBalanceRequest): Promise<OwnerBalanceResponse> {
    const owner = await this.userRepository.findById(ownerId)
    if (!owner) throw new OwnerNotFoundError()
    const orgId = owner.organizationId
    const historySales: HistorySales[] = []

    function setHistory(
      valueService: number,
      percentage: number,
      valueOwner: number,
      nameService: string,
      quantity: number,
      coupon?: string,
    ) {
      historySales.push({
        valueService,
        percentage,
        valueOwner,
        coupon,
        nameService,
        quantity,
      })
    }

    const transactionsSales = await this.transactionRepository.findMany({
      unit: { organizationId: orgId },
      sale: {
        isNot: null,
      },
    })
    const transactionsOwner =
      await this.transactionRepository.findManyByUser(ownerId)
    const transactions = Array.from(
      new Map(
        [...transactionsSales, ...transactionsOwner].map((tx) => [tx.id, tx]),
      ).values(),
    )
    const additions = transactions
      .filter((t) => t.type === 'ADDITION')
      .reduce((acc, transaction) => {
        if (transaction.sale) {
          const totals = transaction.sale.items.reduce(
            (t, item) => {
              let value = item.price
              let percentageOwner = 100

              if (item.productId) t.product += value ?? 0
              else if (item.barberId) {
                const barberPorcent = item.porcentagemBarbeiro ?? 100
                const valueBarber = ((value ?? 0) * barberPorcent) / 100
                percentageOwner = 100 - barberPorcent
                value -= valueBarber
                t.service += value
              } else {
                percentageOwner = 100
                t.service += value
              }
              setHistory(
                Number((item.price ?? 0).toFixed(2)),
                Number(percentageOwner.toFixed(2)),
                Number(value.toFixed(2)),
                item.service?.name ?? item.product?.name ?? '',
                item.quantity,
                item?.coupon?.code ??
                  transaction.sale?.coupon?.code ??
                  undefined,
              )

              t.total += Number(value.toFixed(2))
              return t
            },
            { service: 0, product: 0, total: 0 },
          )
          return acc + totals.service
        } else {
          setHistory(
            transaction.amount,
            100,
            transaction.amount,
            'ADDITION',
            1,
            undefined,
          )
          return acc + transaction.amount
        }
      }, 0)
    const withdrawals = transactions
      .filter((t) => t.type === 'WITHDRAWAL')
      .reduce((acc, t) => {
        setHistory(
          t.amount * -1,
          100,
          t.amount * -1,
          'WITHDRAWAL',
          1,
          undefined,
        )
        return acc + t.amount
      }, 0)

    const balance = Number((0 + additions - withdrawals).toFixed(2))
    return { balance, historySales }
  }
}
