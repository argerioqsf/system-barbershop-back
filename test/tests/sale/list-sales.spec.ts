import { describe, it, expect, beforeEach } from 'vitest'
import { ListSalesUseCase } from '../../../src/modules/sale/application/use-cases/list-sales'
import { FakeSaleRepository } from '../../helpers/fake-repositories'
import { makeSale } from '../../helpers/default-values'
import { PermissionName, RoleName } from '@prisma/client'
import { FakeSaleTelemetry } from '../../helpers/sale/fakes/fake-sale-telemetry'

const s1 = makeSale('s1', 'unit-1', 'org-1')
const s2 = makeSale('s2', 'unit-2', 'org-2')

const defaultActor = {
  id: '1',
  permissions: [PermissionName.LIST_SALES_UNIT],
  unitId: 'unit-1',
  organizationId: 'org-1',
  role: RoleName.ADMIN,
}

describe('ListSalesUseCase', () => {
  let repo: FakeSaleRepository
  let useCase: ListSalesUseCase
  let telemetry: FakeSaleTelemetry

  beforeEach(() => {
    repo = new FakeSaleRepository()
    repo.sales.push(s1, s2)
    telemetry = new FakeSaleTelemetry()
    useCase = new ListSalesUseCase(repo, telemetry)
  })

  it('lists all for admin', async () => {
    const res = await useCase.execute({
      actor: defaultActor,
    })
    expect(res.items).toHaveLength(1)
    expect(telemetry.events).toHaveLength(1)
    expect(telemetry.events[0]).toMatchObject({
      operation: 'sale.list',
      actorId: defaultActor.id,
      metadata: { paginated: false },
    })
  })

  it('filters by organization for owner', async () => {
    const res = await useCase.execute({
      actor: {
        ...defaultActor,
        role: RoleName.OWNER,
      },
    })
    expect(res.items).toHaveLength(1)
    expect(res.items[0].id).toBe('s1')
    expect(telemetry.events.at(-1)).toMatchObject({
      operation: 'sale.list',
    })
  })

  it('filters by unit for others', async () => {
    const res = await useCase.execute({
      actor: {
        ...defaultActor,
        unitId: 'unit-2',
        organizationId: 'org-2',
        role: RoleName.MANAGER,
      },
    })
    expect(res.items).toHaveLength(1)
    expect(res.items[0].id).toBe('s2')
  })

  it('throws if user not found', async () => {
    await expect(
      useCase.execute({
        actor: {
          ...defaultActor,
          id: '',
        },
      }),
    ).rejects.toThrow('User not found')
  })
})
