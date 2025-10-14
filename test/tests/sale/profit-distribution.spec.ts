import { describe, it, expect, vi } from 'vitest'
import { distributeProfits } from '../../../src/services/sale/utils/profit-distribution'
import { CreateTransactionService } from '../../../src/services/transaction/create-transaction'
import {
  FakeOrganizationRepository,
  FakeProfilesRepository,
  FakeUnitRepository,
  FakeTransactionRepository,
  FakeBarberUsersRepository,
  FakeCashRegisterRepository,
  FakeAppointmentRepository,
  FakeBarberServiceRelRepository,
  FakeBarberProductRepository,
  FakeAppointmentServiceRepository,
  FakeSaleRepository,
  FakeSaleItemRepository,
} from '../../helpers/fake-repositories'
import {
  makeSaleWithBarber,
  defaultOrganization,
  defaultUnit,
  barberProfile,
  barberUser,
} from '../../helpers/default-values'

vi.mock(
  '../../../src/services/@factories/transaction/make-create-transaction',
  () => ({
    makeCreateTransaction: () =>
      new CreateTransactionService(transactionRepo, barberRepo, cashRepo),
  }),
)

let transactionRepo: FakeTransactionRepository
let barberRepo: FakeBarberUsersRepository
let cashRepo: FakeCashRegisterRepository

function setup() {
  const orgRepo = new FakeOrganizationRepository({ ...defaultOrganization })
  const profileRepo = new FakeProfilesRepository([
    { ...barberProfile, user: barberUser },
  ])
  const unitRepo = new FakeUnitRepository({ ...defaultUnit })
  transactionRepo = new FakeTransactionRepository()
  barberRepo = new FakeBarberUsersRepository()
  cashRepo = new FakeCashRegisterRepository()
  barberRepo.users.push({ ...barberUser, profile: null })
  cashRepo.session = {
    id: 'sess1',
    openedById: barberUser.id,
    unitId: defaultUnit.id,
    openedAt: new Date(),
    closedAt: null,
    initialAmount: 0,
    transactions: [],
    sales: [],
    finalAmount: null,
    user: barberUser,
  }
  const appointmentRepo = new FakeAppointmentRepository()
  const appointmentServiceRepo = new FakeAppointmentServiceRepository(
    appointmentRepo,
  )
  const barberServiceRepo = new FakeBarberServiceRelRepository()
  const barberProductRepo = new FakeBarberProductRepository()
  const saleRepo = new FakeSaleRepository()
  const saleItemRepo = new FakeSaleItemRepository(saleRepo)
  return {
    orgRepo,
    profileRepo,
    unitRepo,
    transactionRepo,
    barberRepo,
    cashRepo,
    appointmentRepo,
    barberServiceRepo,
    barberProductRepo,
    appointmentServiceRepo,
    saleRepo,
    saleItemRepo,
  }
}

describe('distributeProfits', () => {
  it('distributes amounts between barber and unit', async () => {
    const ctx = setup()
    const sale = makeSaleWithBarber()
    const service = { id: 'svc1', price: 100 }
    sale.items[0].serviceId = service.id
    sale.items[0].service = service as any
    ctx.barberServiceRepo.items.push({
      id: 'rel1',
      profileId: barberProfile.id,
      serviceId: service.id,
      commissionType: 'PERCENTAGE_OF_ITEM',
      commissionPercentage: 50,
      time: null,
    } as any)
    sale.sessionId = 'sess1'
    sale.session = {
      id: 'sess1',
      openedById: barberUser.id,
      unitId: defaultUnit.id,
      openedAt: new Date(),
      closedAt: null,
      initialAmount: 0,
      finalAmount: null,
    }
    sale.paymentStatus = 'PAID'
    sale.items[0].porcentagemBarbeiro = 50
    ctx.saleRepo.sales.push(sale)

    const res = await distributeProfits(
      sale,
      defaultOrganization.id,
      barberUser.id,
      {
        organizationRepository: ctx.orgRepo,
        profileRepository: ctx.profileRepo,
        unitRepository: ctx.unitRepo,
        transactionRepository: ctx.transactionRepo,
        appointmentRepository: ctx.appointmentRepo,
        barberServiceRepository: ctx.barberServiceRepo,
        barberProductRepository: ctx.barberProductRepo,
        appointmentServiceRepository: ctx.appointmentServiceRepo,
        saleItemRepository: ctx.saleItemRepo,
      },
    )

    expect(res.transactions).toHaveLength(2)
  })
})
