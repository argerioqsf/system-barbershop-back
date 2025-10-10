import { describe, it, expect, beforeEach, vi } from 'vitest'
import { UpdatePlanService } from '../../../src/services/plan/update-plan'
import { prisma } from '../../../src/lib/prisma'
import {
  FakePlanRepository,
  FakePlanProfileRepository,
  FakeProfilesRepository,
  FakeSaleRepository,
  FakeSaleItemRepository,
  FakeCouponRepository,
  FakeServiceRepository,
  FakeProductRepository,
  FakeAppointmentRepository,
  FakeBarberUsersRepository,
} from '../../helpers/fake-repositories'
import { RecalculateUserSalesService } from '../../../src/modules/sale/application/use-cases/recalculate-user-sales'
import { SaleItemsBuildService } from '../../../src/modules/sale/application/services/sale-items-build-service'

const plan = {
  id: 'p1',
  price: 10,
  name: 'Old',
  typeRecurrenceId: 'rec1',
  benefits: [],
  unitId: 'unit-1',
}

describe('Update plan service', () => {
  let repo: FakePlanRepository
  let planProfileRepo: FakePlanProfileRepository
  let profilesRepo: FakeProfilesRepository
  let recalc: RecalculateUserSalesService
  let service: UpdatePlanService

  beforeEach(() => {
    repo = new FakePlanRepository([plan])
    planProfileRepo = new FakePlanProfileRepository()
    profilesRepo = new FakeProfilesRepository()
    const saleRepo = new FakeSaleRepository()
    const saleItemRepo = new FakeSaleItemRepository(saleRepo)
    const couponRepo = new FakeCouponRepository()
    const serviceRepo = new FakeServiceRepository()
    const productRepo = new FakeProductRepository()
    const appointmentRepo = new FakeAppointmentRepository()
    const barberRepo = new FakeBarberUsersRepository()
    const saleItemsBuildService = new SaleItemsBuildService({
      serviceRepository: serviceRepo,
      productRepository: productRepo,
      appointmentRepository: appointmentRepo,
      couponRepository: couponRepo,
      barberUserRepository: barberRepo,
      planRepository: repo,
      saleRepository: saleRepo,
      planProfileRepository: planProfileRepo,
    })
    recalc = new RecalculateUserSalesService(
      saleRepo,
      saleItemRepo,
      saleItemsBuildService,
    )
    vi.spyOn(prisma, '$transaction').mockImplementation(async (fn) =>
      fn({} as unknown as import('@prisma/client').Prisma.TransactionClient),
    )
    service = new UpdatePlanService(repo, planProfileRepo, profilesRepo, recalc)
  })

  it('updates benefits list', async () => {
    await service.execute({ id: 'p1', data: {}, benefitIds: ['b1'] })
    const stored = repo.plans[0]
    expect((stored as any).benefits).toHaveLength(1)
    expect((stored as any).benefits[0].benefitId).toBe('b1')
  })
})
