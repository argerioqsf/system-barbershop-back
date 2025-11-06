import { describe, it, expect } from 'vitest'
import {
  FakeTransactionRepository,
  FakeBarberServiceRelRepository,
  FakeBarberProductRepository,
  FakeSaleItemRepository,
  FakeAppointmentServiceRepository,
  FakeSaleRepository,
} from '../../helpers/fake-repositories'
import {
  makeSaleWithBarber,
  defaultUnit,
  barberProfile,
  barberUser,
} from '../../helpers/default-values'
import { SaleProfitDistributionService } from '@/modules/finance/application/services/sale-profit-distribution-service'
import { ProfitDistributionService } from '@/modules/sale/domain/services/profit-distribution'
import { DetailedSale } from '@/repositories/sale-repository'
import { BarberService, Prisma, Service } from '@prisma/client'

function setup() {
  const transactionRepo = new FakeTransactionRepository()
  const barberServiceRepo = new FakeBarberServiceRelRepository()
  const barberProductRepo = new FakeBarberProductRepository()
  const saleRepo = new FakeSaleRepository()
  const saleItemRepo = new FakeSaleItemRepository(saleRepo)
  const appointmentServiceRepo = new FakeAppointmentServiceRepository()

  const profitDistributionDomainService = new ProfitDistributionService()
  const saleProfitDistributionService = new SaleProfitDistributionService(
    transactionRepo,
    barberServiceRepo,
    barberProductRepo,
    saleItemRepo,
    appointmentServiceRepo,
    profitDistributionDomainService,
  )

  return {
    transactionRepo,
    barberServiceRepo,
    saleRepo,
    saleProfitDistributionService,
  }
}

describe('SaleProfitDistributionService (Integration)', () => {
  it('distributes amounts between barber and unit', async () => {
    const { transactionRepo, barberServiceRepo, saleRepo, saleProfitDistributionService } =
      setup()

    const sale = makeSaleWithBarber() as DetailedSale
    const service: Service = {
      id: 'svc1',
      price: 100,
      name: 'Corte',
      description: '',
      imageUrl: '',
      cost: 50,
      defaultTime: 60,
      commissionPercentage: null,
      unitId: defaultUnit.id,
      categoryId: 'cat1',
    }
    sale.items[0].serviceId = service.id
    sale.items[0].service = service

    const barberServiceRelation: BarberService = {
      id: 'rel1',
      profileId: barberProfile.id,
      serviceId: service.id,
      commissionType: 'PERCENTAGE_OF_ITEM',
      commissionPercentage: 50,
      time: null,
    }
    barberServiceRepo.items.push(barberServiceRelation)
    saleRepo.sales.push(sale)

    await saleProfitDistributionService.distribute(
      {
        sale,
        userId: barberUser.id,
        sessionId: 'sess1',
      },
      {} as Prisma.TransactionClient, // Mock Prisma Transaction Client
    )

    expect(transactionRepo.transactions).toHaveLength(2)

    const barberTransaction = transactionRepo.transactions.find(
      (t) => t.affectedUserId === barberProfile.userId,
    )
    const unitTransaction = transactionRepo.transactions.find(
      (t) => !t.affectedUserId,
    )

    expect(barberTransaction?.amount).toBe(50) // 50% of 100
    expect(unitTransaction?.amount).toBe(50)
  })
})
