import { describe, it, expect, beforeEach } from 'vitest'
import { SetSaleStatusService } from '../../../src/services/sale/set-sale-status'
import {
  FakeSaleRepository,
  FakeBarberUsersRepository,
  FakeCashRegisterRepository,
  FakeTransactionRepository,
  FakeOrganizationRepository,
  FakeProfilesRepository,
  FakeUnitRepository,
} from '../../helpers/fake-repositories'
import {
  barberProfile,
  barberUser,
  defaultUser,
  defaultOrganization,
  defaultUnit,
  makeSaleWithBarber,
} from '../../helpers/default-values'
import { PaymentStatus } from '@prisma/client'

describe('Set sale status service', () => {
  let saleRepo: FakeSaleRepository
  let barberRepo: FakeBarberUsersRepository
  let cashRepo: FakeCashRegisterRepository
  let transactionRepo: FakeTransactionRepository
  let orgRepo: FakeOrganizationRepository
  let profileRepo: FakeProfilesRepository
  let unitRepo: FakeUnitRepository
  let service: SetSaleStatusService

  beforeEach(() => {
    saleRepo = new FakeSaleRepository()
    barberRepo = new FakeBarberUsersRepository()
    cashRepo = new FakeCashRegisterRepository()
    transactionRepo = new FakeTransactionRepository()
    orgRepo = new FakeOrganizationRepository({ ...defaultOrganization })
    profileRepo = new FakeProfilesRepository([{ ...barberProfile, user: barberUser }])
    const unit = { ...defaultUnit }
    unitRepo = new FakeUnitRepository(unit, [unit])

    const sale = makeSaleWithBarber()

    saleRepo.sales.push(sale)

    barberRepo.users.push({
      ...defaultUser,
      id: 'cashier',
      organizationId: defaultOrganization.id,
      unitId: defaultUnit.id,
      unit: { organizationId: defaultOrganization.id },
    })

    cashRepo.session = {
      id: 'session-1',
      openedById: 'cashier',
      unitId: defaultUnit.id,
      openedAt: new Date(),
      closedAt: null,
      initialAmount: 0,
      transactions: [],
      sales: [],
      finalAmount: null,
    }

    service = new SetSaleStatusService(
      saleRepo,
      barberRepo,
      cashRepo,
      transactionRepo,
      orgRepo,
      profileRepo,
      unitRepo,
    )
  })

  it('returns sale when status unchanged', async () => {
    const res = await service.execute({
      saleId: 'sale-1',
      userId: 'cashier',
      paymentStatus: PaymentStatus.PENDING,
    })
    expect(res.sale.paymentStatus).toBe(PaymentStatus.PENDING)
    expect(transactionRepo.transactions).toHaveLength(0)
  })

  it('marks sale as paid and updates balances', async () => {
    const res = await service.execute({
      saleId: 'sale-1',
      userId: 'cashier',
      paymentStatus: PaymentStatus.PAID,
    })
    expect(res.sale.paymentStatus).toBe(PaymentStatus.PAID)
    expect(transactionRepo.transactions).toHaveLength(1)
    expect(profileRepo.profiles[0].totalBalance).toBeCloseTo(50)
    expect(unitRepo.unit.totalBalance).toBeCloseTo(50)
    expect(orgRepo.organization.totalBalance).toBeCloseTo(50)
  })
})

