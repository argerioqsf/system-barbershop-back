import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import fastify, { FastifyInstance } from 'fastify'
import {
  PaymentMethod,
  PaymentStatus,
  PermissionCategory,
  PermissionName,
  Prisma,
  RoleName,
} from '@prisma/client'
import {
  FakeSaleRepository,
  FakeBarberUsersRepository,
} from '../../helpers/fake-repositories'
import {
  defaultClient,
  defaultUnit,
  defaultUser,
  makeProfile,
  makeSale,
} from '../../helpers/default-values'
import { FakeSaleTelemetry } from '../../helpers/sale/fakes/fake-sale-telemetry'

let app: FastifyInstance
let saleRepository: FakeSaleRepository
let barberUsersRepository: FakeBarberUsersRepository
let telemetry: FakeSaleTelemetry

const verifyJWTMock = vi.fn(async (request: any) => {
  request.user = {
    sub: defaultUser.id,
    role: RoleName.ADMIN,
    unitId: defaultUser.unitId,
    organizationId: defaultUser.organizationId,
    permissions: [PermissionName.LIST_SALES_UNIT, PermissionName.CREATE_SALE],
  }
})

function verifyModuleFactory() {
  return { verifyJWT: verifyJWTMock }
}

vi.mock('@/http/middlewares/verify-jwt', verifyModuleFactory)
vi.mock('../../../src/http/middlewares/verify-jwt', verifyModuleFactory)

async function makeCreateSaleFactory() {
  const { CreateSaleUseCase } = await import(
    '../../../src/modules/sale/application/use-cases/create-sale'
  )
  return {
    makeCreateSale: () =>
      new CreateSaleUseCase(saleRepository, barberUsersRepository, telemetry),
  }
}

vi.mock(
  '@/modules/sale/infra/factories/make-create-sale',
  makeCreateSaleFactory,
)
vi.mock(
  '../../../src/modules/sale/infra/factories/make-create-sale',
  makeCreateSaleFactory,
)

async function makeListSalesFactory() {
  const { ListSalesUseCase } = await import(
    '../../../src/modules/sale/application/use-cases/list-sales'
  )
  return {
    makeListSales: () => new ListSalesUseCase(saleRepository, telemetry),
  }
}

vi.mock('@/modules/sale/infra/factories/make-list-sales', makeListSalesFactory)
vi.mock(
  '../../../src/modules/sale/infra/factories/make-list-sales',
  makeListSalesFactory,
)

async function makeGetSaleFactory() {
  const { GetSaleUseCase } = await import(
    '../../../src/modules/sale/application/use-cases/get-sale'
  )
  return {
    makeGetSale: () => new GetSaleUseCase(saleRepository, telemetry),
  }
}

vi.mock('@/modules/sale/infra/factories/make-get-sale', makeGetSaleFactory)
vi.mock(
  '../../../src/modules/sale/infra/factories/make-get-sale',
  makeGetSaleFactory,
)

async function makeUpdateSaleFactory() {
  const { UpdateSaleUseCase } = await import(
    '../../../src/modules/sale/application/use-cases/update-sale'
  )
  const runInTransaction = async <T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ) => fn({} as Prisma.TransactionClient)

  return {
    makeUpdateSale: () =>
      new UpdateSaleUseCase(saleRepository, runInTransaction),
  }
}

vi.mock(
  '@/modules/sale/infra/factories/make-update-sale',
  makeUpdateSaleFactory,
)
vi.mock(
  '../../../src/modules/sale/infra/factories/make-update-sale',
  makeUpdateSaleFactory,
)

const paySaleExecute = vi.fn(async ({ saleId }: { saleId: string }) => {
  const existing = saleRepository.sales.find((sale) => sale.id === saleId)
  if (!existing) {
    throw new Error('Sale not found')
  }
  existing.paymentStatus = PaymentStatus.PAID
  return { sale: existing }
})

vi.mock('@/modules/finance/infra/factories/make-pay-sale-coordinator', () => ({
  makePaySaleCoordinator: () => ({ execute: paySaleExecute }),
}))

vi.mock(
  '../../../src/modules/finance/infra/factories/make-pay-sale-coordinator',
  () => ({
    makePaySaleCoordinator: () => ({ execute: paySaleExecute }),
  }),
)

async function buildApp() {
  const { saleRoute } = await import('../../../src/http/controllers/sale/route')
  const instance = fastify()
  await instance.register(saleRoute)
  return instance
}

describe('Sale routes (integration)', () => {
  beforeEach(async () => {
    saleRepository = new FakeSaleRepository()
    barberUsersRepository = new FakeBarberUsersRepository()
    telemetry = new FakeSaleTelemetry()

    const profile = makeProfile('profile-user', defaultUser.id)
    profile.permissions = [
      {
        id: 'perm-create-sale',
        name: PermissionName.CREATE_SALE,
        category: PermissionCategory.SALE,
      },
    ]
    profile.role = {
      id: 'role-admin',
      name: RoleName.ADMIN,
      unitId: defaultUnit.id,
    }

    barberUsersRepository.users = [
      {
        ...defaultUser,
        profile: profile as any,
        unit: defaultUnit,
      },
      defaultClient,
    ]

    app = await buildApp()
  })

  afterEach(async () => {
    if (app) {
      await app.close()
    }
    vi.clearAllMocks()
  })

  it('creates, lists and retrieves sales through HTTP endpoints', async () => {
    const createResponse = await app.inject({
      method: 'POST',
      url: '/sales',
      payload: {
        method: PaymentMethod.CASH,
        clientId: defaultClient.id,
        observation: 'Integração',
      },
    })

    expect(verifyJWTMock).toHaveBeenCalled()
    expect(createResponse.statusCode).toBe(201)

    const createdSale = JSON.parse(createResponse.body)
    expect(createdSale.id).toBeDefined()
    expect(saleRepository.sales).toHaveLength(1)
    expect(telemetry.events[0]).toMatchObject({ operation: 'sale.created' })

    const listResponse = await app.inject({ method: 'GET', url: '/sales' })
    expect(listResponse.statusCode).toBe(200)
    const sales = JSON.parse(listResponse.body)
    expect(sales).toHaveLength(1)
    expect(
      telemetry.events.some((event) => event.operation === 'sale.list'),
    ).toBe(true)

    const getResponse = await app.inject({
      method: 'GET',
      url: `/sales/${createdSale.id}`,
    })
    expect(getResponse.statusCode).toBe(200)
    const sale = JSON.parse(getResponse.body)
    expect(sale.id).toBe(createdSale.id)
    expect(
      telemetry.events.some((event) => event.operation === 'sale.viewed'),
    ).toBe(true)
  })

  it('updates an existing sale', async () => {
    const sale = makeSale('sale-update')
    saleRepository.sales.push(sale)

    const response = await app.inject({
      method: 'PATCH',
      url: `/sales/${sale.id}`,
      payload: {
        observation: 'updated via integration',
        method: PaymentMethod.PIX,
      },
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.observation).toBe('updated via integration')
    expect(body.method).toBe(PaymentMethod.PIX)
    const stored = saleRepository.sales.find((item) => item.id === sale.id)
    expect(stored?.observation).toBe('updated via integration')
    expect(stored?.method).toBe(PaymentMethod.PIX)
  })

  it('pays a sale through coordinator', async () => {
    const sale = makeSale('sale-pay')
    sale.paymentStatus = PaymentStatus.PENDING
    saleRepository.sales.push(sale)

    const response = await app.inject({
      method: 'PATCH',
      url: `/sales/${sale.id}/pay`,
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(paySaleExecute).toHaveBeenCalledWith({
      saleId: sale.id,
      userId: defaultUser.id,
    })
    expect(body.paymentStatus).toBe(PaymentStatus.PAID)
  })
})
