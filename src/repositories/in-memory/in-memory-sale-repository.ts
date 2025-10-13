import {
  Prisma,
  DiscountType,
  PaymentMethod,
  PaymentStatus,
  Discount,
  DiscountOrigin,
  SaleStatus,
} from '@prisma/client'
import {
  SaleRepository,
  DetailedSale,
  DetailedSaleItem,
} from '../sale-repository'
import { randomUUID } from 'crypto'

export class InMemorySaleRepository implements SaleRepository {
  public sales: DetailedSale[] = []

  private sanitizeUser<T extends { password?: string }>(
    user: T | null,
  ): Omit<T, 'password'> | null {
    if (!user) return null
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...rest } = user
    return rest
  }

  private sanitizeSale(sale: DetailedSale): DetailedSale {
    return {
      ...sale,
      user: this.sanitizeUser(sale.user) as DetailedSale['user'],
      client: this.sanitizeUser(sale.client) as DetailedSale['client'],
      items: sale.items.map((item) => ({
        ...item,
        discounts: item.discounts.map((discount) => ({ ...discount })),
        transactions: [],
        appointment: item.appointment
          ? {
              ...item.appointment,
              services:
                item.appointment.services?.map((service) => ({
                  ...service,
                  transactions: [],
                })) ?? [],
            }
          : null,
        barber: this.sanitizeUser(item.barber) as DetailedSaleItem['barber'],
      })),
    }
  }

  async create(data: Prisma.SaleCreateInput): Promise<DetailedSale> {
    const saleId = randomUUID()
    const unitId = (data.unit as { connect: { id: string } }).connect.id
    type SaleItemData = {
      service?: { connect: { id: string } }
      product?: { connect: { id: string } }
      plan?: { connect: { id: string } }
      quantity: number
      barber?: { connect: { id: string } }
      coupon?: { connect: { id: string } }
      appointment?: { connect: { id: string } }
      price: number
      customPrice?: number | null
      discounts: {
        create: {
          amount: number
          type: DiscountType
          origin: string
          order: number
        }[]
      }
      porcentagemBarbeiro?: number | null
    }
    const itemsData =
      (data.items as { create: SaleItemData[] } | undefined)?.create ?? []
    const items: DetailedSaleItem[] = itemsData.map((it) => ({
      id: randomUUID(),
      saleId,
      serviceId: it.service?.connect.id ?? null,
      productId: it.product?.connect.id ?? null,
      appointmentId: it.appointment?.connect.id ?? null,
      quantity: it.quantity,
      barberId: it.barber?.connect.id ?? null,
      couponId: it.coupon?.connect.id ?? null,
      planId: it.plan?.connect.id ?? null,
      price: it.price as number,
      customPrice: it.customPrice ?? null,
      discounts: (it.discounts?.create ?? []).map((d) => ({
        id: randomUUID(),
        saleItemId: '',
        amount: d.amount,
        type: d.type,
        origin: d.origin as DiscountOrigin,
        order: d.order,
      })),
      porcentagemBarbeiro: it.porcentagemBarbeiro ?? null,
      commissionPaid: false,
      transactions: [],
      appointment: it.appointment
        ? {
            id: it.appointment.connect.id,
            clientId: '',
            barberId: '',
            serviceId: '',
            unitId: '',
            date: new Date(),
            status: 'SCHEDULED',
            durationService: null,
            observation: null,
            services: [],
          }
        : null,
      service: it.service
        ? {
            id: it.service.connect.id,
            name: '',
            description: null,
            imageUrl: null,
            cost: 0,
            price: 0,
            categoryId: 'cat-1',
            defaultTime: null,
            commissionPercentage: null,
            unitId: 'unit-1',
          }
        : null,
      product: it.product
        ? {
            id: it.product.connect.id,
            name: '',
            description: null,
            imageUrl: null,
            quantity: 0,
            cost: 0,
            commissionPercentage: null,
            price: 0,
            unitId: 'unit-1',
            categoryId: 'cat-1',
          }
        : null,
      plan: it.plan
        ? {
            id: it.plan.connect.id,
            price: 0,
            name: '',
            typeRecurrenceId: '',
            unitId: 'unit-1',
            saleItems: [],
            benefits: [],
            planProfiles: [],
            debts: [],
          }
        : null,
      barber: it.barber
        ? {
            id: it.barber.connect.id,
            name: '',
            email: '',
            password: '',
            active: true,
            organizationId: 'org-1',
            unitId: 'unit-1',
            versionToken: 1,
            versionTokenInvalidate: null,
            createdAt: new Date(),
            profile: {
              id: 'profile-' + it.barber.connect.id,
              phone: '',
              cpf: '',
              genre: '',
              birthday: '',
              pix: '',
              roleId: randomUUID(),
              commissionPercentage: it.porcentagemBarbeiro ?? 0,
              totalBalance: 0,
              userId: it.barber.connect.id,
              createdAt: new Date(),
            },
          }
        : null,
      coupon: it.coupon
        ? {
            id: it.coupon.connect.id,
            code: '',
            description: null,
            discount: 0,
            discountType: DiscountType.VALUE,
            imageUrl: null,
            quantity: 0,
            unitId: 'unit-1',
            createdAt: new Date(),
          }
        : null,
    }))

    const sale = {
      id: saleId,
      userId: (data.user as { connect: { id: string } }).connect.id,
      clientId: (data.client as { connect: { id: string } }).connect.id,
      unitId,
      sessionId:
        (data.session as { connect: { id: string } } | undefined)?.connect.id ??
        null,
      couponId:
        (data.coupon as { connect: { id: string } } | undefined)?.connect.id ??
        null,
      total: data.total as number,
      gross_value: (data.gross_value as number) ?? 0,
      method: data.method as PaymentMethod,
      paymentStatus: data.paymentStatus as PaymentStatus,
      createdAt: new Date(),
      observation: data.observation ?? null,
      items,
      status: SaleStatus.IN_PROGRESS,
      completionDate: new Date(),
      user: {
        id: (data.user as { connect: { id: string } }).connect.id,
        name: '',
        email: '',
        password: '',
        active: true,
        organizationId: 'org-1',
        unitId: 'unit-1',
        versionToken: 1,
        versionTokenInvalidate: null,
        createdAt: new Date(),
        profile: null,
      },
      client: {
        id: (data.client as { connect: { id: string } }).connect.id,
        name: '',
        email: '',
        password: '',
        active: true,
        organizationId: 'org-1',
        unitId: 'unit-1',
        versionToken: 1,
        versionTokenInvalidate: null,
        createdAt: new Date(),
        profile: null,
      },
      coupon: data.coupon
        ? {
            id: (data.coupon as { connect: { id: string } }).connect.id,
            code: '',
            description: null,
            discount: 0,
            discountType: DiscountType.VALUE,
            imageUrl: null,
            quantity: 0,
            unitId: 'unit-1',
            createdAt: new Date(),
          }
        : null,
      session: null,
      transactions: [],
      unit: {
        id: unitId,
        name: '',
        slug: '',
        organizationId: 'org-1',
        totalBalance: 0,
        allowsLoan: false,
        loanMonthlyLimit: 0,
        slotDuration: 60,
        appointmentFutureLimitDays: 7,
      },
    } as DetailedSale & { unit: { organizationId: string } }
    this.sales.push(sale)
    return this.sanitizeSale(sale)
  }

  async findMany(where: Prisma.SaleWhereInput = {}): Promise<DetailedSale[]> {
    return this.sales
      .filter((s) => {
        if (where.unitId && s.unitId !== where.unitId) return false
        if (
          where.unit &&
          'organizationId' in (where.unit as { organizationId: string })
        ) {
          const orgId = (where.unit as { organizationId: string })
            .organizationId
          const unitOrg =
            (
              s as {
                unit?: { organizationId?: string }
                organizationId?: string
              }
            ).unit?.organizationId ??
            (s as { organizationId?: string }).organizationId
          return unitOrg === orgId
        }
        return true
      })
      .map((sale) => this.sanitizeSale(sale))
  }

  async findById(id: string): Promise<DetailedSale | null> {
    const sale = this.sales.find((s) => s.id === id) ?? null
    return sale ? this.sanitizeSale(sale) : null
  }

  async findManyPaginated(
    where: Prisma.SaleWhereInput,
    page: number,
    perPage: number,
  ): Promise<{ items: DetailedSale[]; count: number }> {
    const all = await this.findMany(where)
    const count = all.length
    const items = all.slice(
      (page - 1) * perPage,
      (page - 1) * perPage + perPage,
    )
    return { items, count }
  }

  async update(
    id: string,
    data: Prisma.SaleUpdateInput,
  ): Promise<DetailedSale> {
    const sale = this.sales.find((s) => s.id === id)
    if (!sale) throw new Error('Sale not found')
    if (data.method) {
      sale.method = data.method as PaymentMethod
    }
    if (data.observation !== undefined) {
      sale.observation = data.observation as string | null
    }
    if (data.paymentStatus) {
      sale.paymentStatus = data.paymentStatus as PaymentStatus
    }
    if (data.session && 'connect' in data.session) {
      const sid = (data.session as { connect: { id: string } }).connect.id
      sale.sessionId = sid
      sale.session = {
        id: sid,
        openedById: '',
        unitId: sale.unitId,
        openedAt: new Date(),
        closedAt: null,
        initialAmount: 0,
        finalAmount: null,
      }
    }
    if (data.total !== undefined) {
      sale.total = data.total as number
    }
    if (data.gross_value !== undefined) {
      sale.gross_value = data.gross_value as number
    }
    if (data.coupon && 'connect' in data.coupon) {
      const cid = (data.coupon as { connect: { id: string } }).connect.id
      sale.couponId = cid
      sale.coupon = {
        id: cid,
        code: '',
        description: null,
        discount: 0,
        discountType: DiscountType.VALUE,
        imageUrl: null,
        quantity: 0,
        unitId: 'unit-1',
        createdAt: new Date(),
      }
    } else if ('couponId' in data && data.couponId === null) {
      sale.couponId = null
      sale.coupon = null
    }
    if (data.client && 'connect' in data.client) {
      const cid = (data.client as { connect: { id: string } }).connect.id
      sale.clientId = cid
      sale.client = {
        id: cid,
        name: '',
        email: '',
        password: '',
        active: true,
        organizationId: 'org-1',
        unitId: sale.unitId,
        versionToken: 1,
        versionTokenInvalidate: null,
        createdAt: new Date(),
        profile: null,
      }
    }
    if (data.items) {
      const itemsData = data.items as {
        create?: Prisma.SaleItemCreateWithoutSaleInput[]
        deleteMany?: { id: string }[]
      }
      if (itemsData.deleteMany) {
        for (const del of itemsData.deleteMany) {
          sale.items = sale.items.filter((i) => i.id !== del.id)
        }
      }
      if (itemsData.create) {
        for (const it of itemsData.create) {
          const newItem: DetailedSaleItem = {
            id: randomUUID(),
            saleId: sale.id,
            serviceId:
              (it.service as { connect?: { id: string } } | undefined)?.connect
                ?.id ?? null,
            productId:
              (it.product as { connect?: { id: string } } | undefined)?.connect
                ?.id ?? null,
            planId:
              (it.plan as { connect?: { id: string } } | undefined)?.connect
                ?.id ?? null,
            appointmentId:
              (it.appointment as { connect?: { id: string } } | undefined)
                ?.connect?.id ?? null,
            quantity: it.quantity as number,
            barberId:
              (it.barber as { connect?: { id: string } } | undefined)?.connect
                ?.id ?? null,
            couponId:
              (it.coupon as { connect?: { id: string } } | undefined)?.connect
                ?.id ?? null,
            price: it.price as number,
            customPrice: it.customPrice ?? null,
            discounts: (
              (it.discounts as { create: Discount[] })?.create ?? []
            ).map((d) => ({
              id: randomUUID(),
              saleItemId: '',
              amount: d.amount,
              type: d.type,
              origin: d.origin as DiscountOrigin,
              order: d.order,
            })),
            porcentagemBarbeiro:
              (it.porcentagemBarbeiro as number | null) ?? null,
            commissionPaid: false,
            appointment: it.appointment
              ? {
                  id: (it.appointment as { connect: { id: string } }).connect
                    .id,
                  clientId: '',
                  barberId: '',
                  unitId: '',
                  date: new Date(),
                  status: 'SCHEDULED',
                  durationService: null,
                  observation: null,
                  services: [],
                }
              : null,
            service: it.service
              ? {
                  id: (it.service as { connect: { id: string } }).connect.id,
                  name: '',
                  description: null,
                  imageUrl: null,
                  cost: 0,
                  price: 0,
                  categoryId: 'cat-1',
                  defaultTime: null,
                  commissionPercentage: null,
                  unitId: 'unit-1',
                }
              : null,
            product: it.product
              ? {
                  id: (it.product as { connect: { id: string } }).connect.id,
                  name: '',
                  description: null,
                  imageUrl: null,
                  quantity: 0,
                  cost: 0,
                  commissionPercentage: null,
                  price: 0,
                  unitId: 'unit-1',
                  categoryId: 'cat-1',
                }
              : null,
            plan: it.plan
              ? {
                  id: (it.plan as { connect: { id: string } }).connect.id,
                  price: 0,
                  name: '',
                  typeRecurrenceId: '',
                  unitId: sale.unitId,
                }
              : null,
            barber: it.barber
              ? {
                  id: (it.barber as { connect: { id: string } }).connect.id,
                  name: '',
                  email: '',
                  password: '',
                  active: true,
                  organizationId: 'org-1',
                  unitId: 'unit-1',
                  versionToken: 1,
                  versionTokenInvalidate: null,
                  createdAt: new Date(),
                  profile: {
                    id:
                      'profile-' +
                      (it.barber as { connect: { id: string } }).connect.id,
                    phone: '',
                    cpf: '',
                    genre: '',
                    birthday: '',
                    pix: '',
                    roleId: randomUUID(),
                    commissionPercentage: it.porcentagemBarbeiro ?? 0,
                    totalBalance: 0,
                    userId: (it.barber as { connect: { id: string } }).connect
                      .id,
                    createdAt: new Date(),
                  },
                }
              : null,
            coupon: it.coupon
              ? {
                  id: (it.coupon as { connect: { id: string } }).connect.id,
                  code: '',
                  description: null,
                  discount: 0,
                  discountType: DiscountType.VALUE,
                  imageUrl: null,
                  quantity: 0,
                  unitId: 'unit-1',
                  createdAt: new Date(),
                }
              : null,
          }
          sale.items.push(newItem)
        }
      }
    }
    sale.transactions = sale.transactions ?? []
    return this.sanitizeSale(sale)
  }

  async updateStatus(id: string, status: PaymentStatus): Promise<DetailedSale> {
    const sale = this.sales.find((s) => s.id === id)
    if (!sale) {
      throw new Error('Sale not found')
    }
    sale.paymentStatus = status
    return this.sanitizeSale(sale)
  }

  async findManyByDateRange(start: Date, end: Date): Promise<DetailedSale[]> {
    return this.sales
      .filter((s) => s.createdAt >= start && s.createdAt <= end)
      .map((sale) => this.sanitizeSale(sale))
  }

  async findManyByUser(userId: string): Promise<DetailedSale[]> {
    return this.sales
      .filter((s) => s.userId === userId)
      .map((sale) => this.sanitizeSale(sale))
  }

  async findManyByBarber(barberId: string): Promise<DetailedSale[]> {
    return this.sales
      .filter((s) => s.items.some((i) => i.barberId === barberId))
      .map((sale) => this.sanitizeSale(sale))
  }

  async findManyBySession(sessionId: string): Promise<DetailedSale[]> {
    return this.sales
      .filter((s) => s.sessionId === sessionId)
      .map((sale) => this.sanitizeSale(sale))
  }
}
