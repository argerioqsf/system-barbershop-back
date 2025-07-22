import { describe, it, expect, beforeEach } from 'vitest'
import { PaymentMethod, PermissionName, PermissionCategory } from '@prisma/client'
import { CreateSaleService } from '../../../src/services/sale/create-sale'
import { FakeSaleRepository, FakeBarberUsersRepository } from '../../helpers/fake-repositories'
import { defaultUser, defaultClient } from '../../helpers/default-values'

function setup() {
  const saleRepo = new FakeSaleRepository()
  const barberRepo = new FakeBarberUsersRepository()
  const service = new CreateSaleService(saleRepo, barberRepo)
  return { saleRepo, barberRepo, service }
}

describe('Create sale service', () => {
  let ctx: ReturnType<typeof setup>

  beforeEach(() => {
    ctx = setup()
    ctx.barberRepo.users.push({
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
          { id: 'perm-sale', name: PermissionName.CREATE_SALE, category: PermissionCategory.SALE },
        ],
        role: { id: 'role-1', name: 'ADMIN', unitId: 'unit-1' },
        workHours: [],
        blockedHours: [],
        barberServices: [],
        plans: [],
      },
    }, defaultClient)
  })

  it('creates a sale with default values', async () => {
    const result = await ctx.service.execute({
      userId: defaultUser.id,
      method: PaymentMethod.CASH,
      clientId: defaultClient.id,
      observation: 'obs',
    })

    expect(result.sale.method).toBe(PaymentMethod.CASH)
    expect(result.sale.paymentStatus).toBe('PENDING')
    expect(ctx.saleRepo.sales).toHaveLength(1)
  })

  it('throws when user lacks permission', async () => {
    ctx.barberRepo.users[0].profile.permissions = []
    await expect(
      ctx.service.execute({
        userId: defaultUser.id,
        method: PaymentMethod.CASH,
        clientId: defaultClient.id,
      }),
    ).rejects.toThrow('Permission denied')
  })
})
