import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SetSaleStatusService } from '../../../src/services/sale/set-sale-status'
import { CreateTransactionService } from '../../../src/services/transaction/create-transaction'
import {
  FakeSaleRepository,
  FakeBarberUsersRepository,
  FakeBarberServiceRelRepository,
  FakeBarberProductRepository,
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
  makeSale,
  makeService,
  makeBarberServiceRel,
} from '../../helpers/default-values'

let transactionRepo: FakeTransactionRepository
let barberRepo: FakeBarberUsersRepository
let cashRepo: FakeCashRegisterRepository
let barberServiceRepo: FakeBarberServiceRelRepository
let barberProductRepo: FakeBarberProductRepository

vi.mock('../../../src/services/@factories/transaction/make-create-transaction', () => ({
  makeCreateTransaction: () => new CreateTransactionService(transactionRepo, barberRepo, cashRepo),
}))
import { PaymentStatus } from '@prisma/client'

describe('Set sale status service', () => {
  let saleRepo: FakeSaleRepository
  let orgRepo: FakeOrganizationRepository
  let profileRepo: FakeProfilesRepository
  let unitRepo: FakeUnitRepository
  let service: SetSaleStatusService

  beforeEach(() => {
    saleRepo = new FakeSaleRepository()
    barberRepo = new FakeBarberUsersRepository()
    barberServiceRepo = new FakeBarberServiceRelRepository()
    barberProductRepo = new FakeBarberProductRepository()
    cashRepo = new FakeCashRegisterRepository()
    transactionRepo = new FakeTransactionRepository()
    orgRepo = new FakeOrganizationRepository({ ...defaultOrganization })
    profileRepo = new FakeProfilesRepository([{ ...barberProfile, user: barberUser }])
    const unit = { ...defaultUnit }
    unitRepo = new FakeUnitRepository(unit, [unit])

    const sale = makeSaleWithBarber()

    saleRepo.sales.push(sale)

    barberRepo.users.push(
      {
        ...defaultUser,
        id: 'cashier',
        organizationId: defaultOrganization.id,
        unitId: defaultUnit.id,
        unit: { organizationId: defaultOrganization.id },
      },
      barberUser as any,
    )

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
      barberServiceRepo,
      barberProductRepo,
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
    expect(transactionRepo.transactions).toHaveLength(2)
    expect(profileRepo.profiles[0].totalBalance).toBeCloseTo(50)
    expect(unitRepo.unit.totalBalance).toBeCloseTo(50)
  })

  it('uses relation percentage when paying a pending sale', async () => {
    const serviceDef = { ...makeService('svc-1', 100), commissionPercentage: 30 }
    const sale = makeSale('sale-2')
    sale.items.push({
      id: 'it2',
      saleId: sale.id,
      serviceId: serviceDef.id,
      productId: null,
      quantity: 1,
      barberId: barberUser.id,
      couponId: null,
      price: 100,
      discount: null,
      discountType: null,
      porcentagemBarbeiro: null,
      service: serviceDef,
      product: null,
      barber: { ...barberUser, profile: barberProfile },
      coupon: null,
    })
    saleRepo.sales.push(sale)
    barberServiceRepo.items.push(
      makeBarberServiceRel(
        barberProfile.id,
        serviceDef.id,
        'PERCENTAGE_OF_SERVICE',
      ),
    )

    const res = await service.execute({
      saleId: 'sale-2',
      userId: 'cashier',
      paymentStatus: PaymentStatus.PAID,
    })

    expect(res.sale.items[0].porcentagemBarbeiro).toBe(30)
    expect(profileRepo.profiles[0].totalBalance).toBeCloseTo(30)
    expect(unitRepo.unit.totalBalance).toBeCloseTo(70)
  })
})

