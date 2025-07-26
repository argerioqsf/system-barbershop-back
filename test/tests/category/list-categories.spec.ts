import { describe, it, expect, beforeEach } from 'vitest'
import { ListCategoriesService } from '../../../src/services/category/list-categories'
import { FakeCategoryRepository } from '../../helpers/fake-repositories'
import { Category } from '@prisma/client'

const c1: Category = { id: 'c1', name: 'Hair', unitId: 'unit-1' }
const c2: Category = { id: 'c2', name: 'Beard', unitId: 'unit-2' }

describe('List categories service', () => {
  let repo: FakeCategoryRepository
  let service: ListCategoriesService

  beforeEach(() => {
    repo = new FakeCategoryRepository([c1, c2])
    service = new ListCategoriesService(repo)
  })

  it('returns only categories from user unit', async () => {
    const res = await service.execute({
      sub: '1',
      role: 'ADMIN',
      unitId: 'unit-1',
      organizationId: 'org-1',
    })
    expect(res.categories).toHaveLength(1)
    expect(res.categories[0].id).toBe('c1')
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
