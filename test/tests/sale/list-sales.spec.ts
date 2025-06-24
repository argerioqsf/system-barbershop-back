import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ListSalesService } from '../../../src/services/sale/list-sales'
import {
  FakeSaleRepository,
  FakeProfilesRepository,
} from '../../helpers/fake-repositories'
import { makeSale, makeProfile } from '../../helpers/default-values'
import { GetUserProfileFromUserIdService } from '../../../src/services/profile/get-profile-from-userId-service'
import { PermissionCategory, PermissionName } from '@prisma/client'

const profileRepo = new FakeProfilesRepository()

vi.mock(
  '../../../src/services/@factories/profile/get-profile-from-userId-service',
  () => ({
    getProfileFromUserIdService: () =>
      new GetUserProfileFromUserIdService(profileRepo),
  }),
)

const s1 = makeSale('s1', 'unit-1', 'org-1')
const s2 = makeSale('s2', 'unit-2', 'org-2')

describe('List sales service', () => {
  let repo: FakeSaleRepository
  let service: ListSalesService

  beforeEach(() => {
    repo = new FakeSaleRepository()
    repo.sales.push(s1, s2)
    service = new ListSalesService(repo)
    const profile = makeProfile('prof-1', '1')
    profile.permissions = [
      {
        id: 'perm',
        name: PermissionName.LIST_SALES_UNIT,
        category: PermissionCategory.SALE,
      },
    ]
    profileRepo.profiles = [profile]
  })

  it('lists all for admin', async () => {
    const res = await service.execute({
      sub: '1',
      permissions: ['LIST_SALES_UNIT'],
      unitId: 'unit-1',
      organizationId: 'org-1',
    })
    expect(res.sales).toHaveLength(1)
  })

  it('filters by organization for owner', async () => {
    const res = await service.execute({
      sub: '1',
      permissions: ['LIST_SALES_UNIT'],
      unitId: 'unit-1',
      organizationId: 'org-1',
    })
    expect(res.sales).toHaveLength(1)
    expect(res.sales[0].id).toBe('s1')
  })

  it('filters by unit for others', async () => {
    const res = await service.execute({
      sub: '1',
      permissions: ['LIST_SALES_UNIT'],
      unitId: 'unit-2',
      organizationId: 'org-2',
    })
    expect(res.sales).toHaveLength(1)
    expect(res.sales[0].id).toBe('s2')
  })

  it('throws if user not found', async () => {
    await expect(
      service.execute({
        sub: '',
        role: 'ADMIN',
        unitId: 'unit-1',
        organizationId: 'org-1',
      }),
    ).rejects.toThrow('User not found')
  })
})
