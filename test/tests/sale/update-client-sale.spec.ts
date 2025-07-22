import { describe, it, expect, beforeEach, vi } from 'vitest'
import { UpdateClientSaleService } from '../../../src/services/sale/update-client-sale'
import {
  FakeSaleRepository,
  FakeProfilesRepository,
  FakeSaleItemRepository,
  FakePlanRepository,
  FakePlanProfileRepository,
} from '../../helpers/fake-repositories'
import { makeSale, makeProfile, defaultClient } from '../../helpers/default-values'
import { prisma } from '../../../src/lib/prisma'

let saleRepo: FakeSaleRepository
let profileRepo: FakeProfilesRepository
let saleItemRepo: FakeSaleItemRepository
let planRepo: FakePlanRepository
let planProfileRepo: FakePlanProfileRepository
let service: UpdateClientSaleService

beforeEach(() => {
  saleRepo = new FakeSaleRepository()
  profileRepo = new FakeProfilesRepository()
  saleItemRepo = new FakeSaleItemRepository(saleRepo)
  planRepo = new FakePlanRepository()
  planProfileRepo = new FakePlanProfileRepository()
  saleRepo.sales.push(makeSale('sale-1'))
  const newClient = { ...defaultClient, id: 'c2' }
  profileRepo.profiles = [
    { ...makeProfile('p-c2', 'c2'), user: newClient },
  ]
  service = new UpdateClientSaleService(
    saleRepo,
    profileRepo,
    saleItemRepo,
    planRepo,
    planProfileRepo,
  )
  vi.spyOn(prisma, '$transaction').mockImplementation(async (fn) =>
    fn({
      discount: { deleteMany: vi.fn() },
      planProfile: { deleteMany: vi.fn() },
    } as any),
  )
})

describe('Update client sale service', () => {
  it('updates client of sale', async () => {
    const result = await service.execute({ id: 'sale-1', clientId: 'c2' })

    expect(result.sale?.clientId).toBe('c2')
    expect(saleRepo.sales[0].clientId).toBe('c2')
  })

  it('throws when no changes', async () => {
    await expect(
      service.execute({ id: 'sale-1', clientId: 'client-1' }),
    ).rejects.toThrow('No changes to the client')
  })
})
