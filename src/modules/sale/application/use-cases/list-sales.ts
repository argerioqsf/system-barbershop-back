import {
  PaymentMethod,
  PaymentStatus,
  PermissionName,
  RoleName,
} from '@prisma/client'
import {
  DetailedSale,
  SaleRepository,
} from '@/modules/sale/application/ports/sale-repository'
import { assertPermission } from '@/utils/permissions'
import { UserNotFoundError } from '@/services/@errors/user/user-not-found-error'
import { SaleTelemetry } from '@/modules/sale/application/ports/sale-telemetry'

export interface ListSalesActor {
  id: string
  unitId: string
  organizationId: string
  role: RoleName
  permissions?: PermissionName[]
}

export interface ListSalesFilters {
  page?: number
  perPage?: number
  withCount?: boolean
  paymentStatus?: PaymentStatus
  method?: PaymentMethod
  from?: Date
  to?: Date
  clientId?: string
  userId?: string
}

export interface ListSalesUseCaseOutput {
  items: DetailedSale[]
  count: number
  page: number
  perPage: number
}

export interface ListSalesUseCaseInput {
  actor: ListSalesActor
  filters?: ListSalesFilters
}

export class ListSalesUseCase {
  constructor(
    private readonly saleRepository: SaleRepository,
    private readonly telemetry?: SaleTelemetry,
  ) {}

  async execute({
    actor,
    filters = {},
  }: ListSalesUseCaseInput): Promise<ListSalesUseCaseOutput> {
    if (!actor.id) {
      throw new UserNotFoundError()
    }

    assertPermission([PermissionName.LIST_SALES_UNIT], actor.permissions)

    const where = {
      ...{ unitId: actor.unitId },
      ...(filters.paymentStatus
        ? { paymentStatus: filters.paymentStatus }
        : {}),
      ...(filters.method ? { method: filters.method } : {}),
      ...(filters.clientId ? { clientId: filters.clientId } : {}),
      ...(filters.userId ? { userId: filters.userId } : {}),
      ...((filters.from || filters.to) && {
        createdAt: {
          ...(filters.from ? { gte: filters.from } : {}),
          ...(filters.to ? { lte: filters.to } : {}),
        },
      }),
    }

    const { page, perPage, withCount } = filters

    if (page && perPage) {
      const { items, count } = await this.saleRepository.findManyPaginated(
        where,
        page,
        perPage,
      )

      await this.telemetry?.record({
        operation: 'sale.list',
        actorId: actor.id,
        metadata: {
          paginated: true,
          page,
          perPage,
          withCount,
          appliedFilters: this.describeFilters(filters),
        },
      })

      return {
        items,
        count: withCount ? count : 0,
        page: withCount ? page : 0,
        perPage: withCount ? perPage : 0,
      }
    }

    const items = await this.saleRepository.findMany(where)

    await this.telemetry?.record({
      operation: 'sale.list',
      actorId: actor.id,
      metadata: {
        paginated: false,
        withCount,
        appliedFilters: this.describeFilters(filters),
      },
    })

    return {
      items,
      count: withCount ? items.length : 0,
      page: withCount ? 1 : 0,
      perPage: withCount ? items.length : 0,
    }
  }

  private describeFilters(filters: ListSalesFilters) {
    const { paymentStatus, method, from, to, clientId, userId } = filters

    return {
      paymentStatus,
      method,
      from: from?.toISOString(),
      to: to?.toISOString(),
      clientId,
      userId,
    }
  }
}
