import { describe, it, expect, beforeEach } from 'vitest'
import {
  PaymentMethod,
  PermissionName,
  PermissionCategory,
} from '@prisma/client'
import { CreateSaleUseCase } from '../../../src/modules/sale/application/use-cases/create-sale'
import {
  FakeSaleRepository,
  FakeBarberUsersRepository,
} from '../../helpers/fake-repositories'
import { defaultUser, defaultClient } from '../../helpers/default-values'
import { FakeSaleTelemetry } from '../../helpers/sale/fakes/fake-sale-telemetry'

function setup() {
  const saleRepo = new FakeSaleRepository()
  const barberRepo = new FakeBarberUsersRepository()
  const telemetry = new FakeSaleTelemetry()
  const useCase = new CreateSaleUseCase(saleRepo, barberRepo, telemetry)
  return { saleRepo, barberRepo, useCase, telemetry }
}

describe('Create sale service', () => {
  let ctx: ReturnType<typeof setup>

  beforeEach(() => {
    ctx = setup()
    ctx.barberRepo.users.push(
      {
        ...defaultUser,
        profile: {
          id: 'profile-user',
          phone: '',
          cpf: '',
          genre: '',
          birthday: '',
          pix: '',
          roleId: 'role-1',
          commissionPercentage: 0,
          totalBalance: 0,
          userId: defaultUser.id,
          createdAt: new Date(),
          permissions: [
            {
              id: 'perm-sale',
              name: PermissionName.CREATE_SALE,
              category: PermissionCategory.SALE,
            },
          ],
          role: { id: 'role-1', name: 'ADMIN', unitId: 'unit-1' },
          workHours: [],
          blockedHours: [],
          barberServices: [],
          barberProducts: [],
          plans: [],
        },
      },
      defaultClient,
    )
  })

  it('should create a sale when payment method is provided', async () => {
    const result = await ctx.useCase.execute({
      userId: defaultUser.id,
      method: PaymentMethod.CASH,
      clientId: defaultClient.id,
      observation: 'obs',
    })

    expect(result.sale.method).toBe(PaymentMethod.CASH)
    expect(result.sale.paymentStatus).toBe('PENDING')
    expect(ctx.saleRepo.sales).toHaveLength(1)
    expect(ctx.telemetry.events).toHaveLength(1)
    expect(ctx.telemetry.events[0]).toMatchObject({
      operation: 'sale.created',
      saleId: result.sale.id,
      actorId: defaultUser.id,
    })
  })

  it('should create a sale with CASH as default payment method if not provided', async () => {
    const result = await ctx.useCase.execute({
      userId: defaultUser.id,
      clientId: defaultClient.id,
    })

    expect(result.sale.method).toBe(PaymentMethod.CASH)
    expect(result.sale.paymentStatus).toBe('PENDING')
    expect(ctx.saleRepo.sales).toHaveLength(1)
    expect(ctx.telemetry.events.at(-1)).toMatchObject({
      operation: 'sale.created',
      actorId: defaultUser.id,
    })
  })

  it('throws when user lacks permission', async () => {
    if (ctx.barberRepo.users[0].profile) {
      ctx.barberRepo.users[0].profile.permissions = []
    }
    await expect(
      ctx.useCase.execute({
        userId: defaultUser.id,
        method: PaymentMethod.CASH,
        clientId: defaultClient.id,
      }),
    ).rejects.toThrow('Permission denied')
  })
})
