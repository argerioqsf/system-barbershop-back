import {
  TransactionReadItem,
  TransactionReadRepository,
} from '@/modules/finance/application/ports/transaction-read-repository'
import {
  CollaboratorTransaction,
  CollaboratorTransactionsRepository,
  CollaboratorTransactionSale,
  CollaboratorTransactionSaleItem,
  CollaboratorTransactionUser,
} from '@/modules/collaborator/application/ports/collaborator-transactions-repository'

function toNumber(value?: number): number | null {
  if (value === null || value === undefined) {
    return null
  }

  const coerced = Number(value)
  return Number.isFinite(coerced) ? coerced : null
}

function mapUser(
  user:
    | (
        | NonNullable<TransactionReadItem['sale']>['user']
        | (TransactionReadItem['user'] & {
            profile?: undefined
          })
      )
    | null,
): CollaboratorTransactionUser | null {
  if (!user) {
    return null
  }

  return {
    id: user.id,
    name: user.name ?? null,
    profile: user.profile
      ? {
          id: user.profile.id,
          name: user.name ?? null,
        }
      : null,
  }
}

function mapSaleItem(
  item: NonNullable<TransactionReadItem['sale']>['items'][number],
): CollaboratorTransactionSaleItem {
  return {
    id: item.id,
    price: toNumber(item.price),
    customPrice: toNumber(item.customPrice ?? undefined) ?? undefined,
    service: item.service
      ? {
          id: item.service.id,
          name: item.service.name ?? null,
        }
      : null,
    product: item.product
      ? {
          id: item.product.id,
          name: item.product.name ?? null,
        }
      : null,
    barber: item.barber
      ? {
          id: item.barber.id,
          profile: item.barber.profile
            ? {
                id: item.barber.profile.id,
                name: item.barber.name ?? null,
              }
            : null,
        }
      : null,
    discounts: (item.discounts ?? []).map(
      (
        discount: NonNullable<
          TransactionReadItem['sale']
        >['items'][number]['discounts'][number],
      ) => ({
        id: discount.id,
        amount: toNumber(discount.amount) ?? 0,
        type: discount.type,
        origin: discount.origin ?? null,
        order: discount.order ?? null,
      }),
    ),
  }
}

function mapSale(
  sale: TransactionReadItem['sale'],
): CollaboratorTransactionSale | null {
  if (!sale) {
    return null
  }

  return {
    id: sale.id,
    coupon: sale.coupon
      ? {
          id: sale.coupon.id,
          code: sale.coupon.code ?? null,
        }
      : null,
    items: (sale.items ?? []).map(mapSaleItem),
    user: mapUser(sale.user ?? null),
  }
}

function mapTransaction(
  transaction: TransactionReadItem,
): CollaboratorTransaction {
  return {
    id: transaction.id,
    amount: toNumber(transaction.amount) ?? 0,
    reason: transaction.reason,
    description: transaction.description ?? null,
    createdAt: new Date(transaction.createdAt),
    saleId: transaction.saleId ?? null,
    saleItemId: transaction.saleItemId ?? null,
    sale: mapSale(transaction.sale ?? null),
    user: mapUser(transaction.user ?? null),
    affectedUser: mapUser(transaction.affectedUser ?? null),
  }
}

export class FinanceTransactionReadAdapter
  implements CollaboratorTransactionsRepository
{
  constructor(private readonly transactions: TransactionReadRepository) {}

  async findManyByCollaborator(
    collaboratorId: string,
  ): Promise<CollaboratorTransaction[]> {
    const results = await this.transactions.findManyByAffectedUser(
      collaboratorId,
    )

    return results.map(mapTransaction)
  }
}
