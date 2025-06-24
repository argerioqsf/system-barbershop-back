import { describe, it, expect, beforeEach } from 'vitest'
import { ListProductSellersService } from '../../../src/services/users/list-product-sellers'
import { InMemoryBarberUsersRepository } from '../../helpers/fake-repositories'
import { makeProfile, makeUser, makeUnit } from '../../helpers/default-values'
import { PermissionCategory, PermissionName } from '@prisma/client'

describe('List product sellers service', () => {
  let repo: InMemoryBarberUsersRepository
  let service: ListProductSellersService

  beforeEach(() => {
    const unit = makeUnit('unit-1')
    const profile1 = { ...makeProfile('p1', 'u1'), permissions: [] }
    const profile2 = {
      ...makeProfile('p2', 'u2'),
      permissions: [
        {
          id: 'perm',
          name: PermissionName.SELL_PRODUCT,
          category: PermissionCategory.PRODUCT,
        },
      ],
    }
    repo = new InMemoryBarberUsersRepository([
      makeUser('u1', profile1, unit),
      makeUser('u2', profile2, unit),
    ])
    service = new ListProductSellersService(repo)
  })

  it('returns users that can sell products', async () => {
    const res = await service.execute({
      sub: 'admin',
      role: 'ADMIN',
      unitId: 'unit-1',
      organizationId: 'org-1',
    })
    expect(res.users).toHaveLength(1)
    expect(res.users[0].id).toBe('u2')
  })
})
