import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PayCommissionUseCase } from '../../../src/modules/finance/application/use-cases/pay-commission'
import { CreateTransactionService } from '../../../src/services/transaction/create-transaction'
import {
  FakeProfilesRepository,
  FakeSaleRepository,
  FakeSaleItemRepository,
  FakeAppointmentRepository,
  FakeAppointmentServiceRepository,
  FakeTransactionRepository,
  FakeBarberUsersRepository,
  FakeCashRegisterRepository,
} from '../../helpers/fake-repositories'
import {
  makeProfile,
  makeUser,
  makeSaleWithBarber,
  makeCashSession,
  defaultUnit,
} from '../../helpers/default-values'
import { IncrementBalanceProfileService } from '../../../src/services/profile/increment-balance'
import { TransactionReason } from '../../../src/modules/finance/domain/entities/transaction'
import { Money } from '../../../src/core/domain/value-objects/money'
import { CommissionCalculator } from '../../../src/modules/finance/domain/services/commission-calculator'

import { NegativeValuesNotAllowedError } from '../../../src/modules/finance/application/errors/negative-values-not-allowed-error'

let service: PayCommissionUseCase
let profileRepo: FakeProfilesRepository
let saleRepo: FakeSaleRepository
let saleItemRepo: FakeSaleItemRepository
let appointmentRepo: FakeAppointmentRepository
let appointmentServiceRepo: FakeAppointmentServiceRepository
let txRepo: FakeTransactionRepository
let barberRepo: FakeBarberUsersRepository
let cashRepo: FakeCashRegisterRepository
let user: ReturnType<typeof makeUser>

vi.mock(
  '../../../src/services/@factories/transaction/make-create-transaction',
  () => ({
    makeCreateTransaction: () =>
      new CreateTransactionService(txRepo, barberRepo, cashRepo),
  }),
)

async function setup(balance = 100) {
  profileRepo = new FakeProfilesRepository()
  saleRepo = new FakeSaleRepository()
  saleItemRepo = new FakeSaleItemRepository(saleRepo)
  appointmentRepo = new FakeAppointmentRepository()
  appointmentServiceRepo = new FakeAppointmentServiceRepository(appointmentRepo)
  txRepo = new FakeTransactionRepository()
  barberRepo = new FakeBarberUsersRepository()
  cashRepo = new FakeCashRegisterRepository()
  const profile = makeProfile('p1', 'u1', balance)
  profileRepo.profiles.push(profile)
  user = makeUser('u1', profile, defaultUnit)
  barberRepo.users.push(user)
  cashRepo.session = { ...makeCashSession('s1', user.unitId), user }

  const incrementBalanceProfileService = new IncrementBalanceProfileService(
    profileRepo,
  )

  const commissionCalculator = new CommissionCalculator()

  service = new PayCommissionUseCase(
    saleItemRepo,
    appointmentServiceRepo,
    incrementBalanceProfileService,
    commissionCalculator,
  )
}

async function makePaymentItems() {
  const sale = { ...makeSaleWithBarber(), id: 's1', paymentStatus: 'PAID' }
  sale.items[0].id = 'it1'
  sale.items[0].barberId = user.id
  sale.items[0].serviceId = 'svc1'
  sale.items[0].price = 40
  sale.items[0].porcentagemBarbeiro = 50
  ;(sale.items[0] as any).commissionPaid = false
  saleRepo.sales.push(sale as any)

  const saleRecord: PaymentItems = {
    saleId: sale.id,
    saleItemId: sale.items[0].id,
    amount: 20,
    item: sale.items[0] as any,
    sale: sale as any,
    transactions: [],
  }

  const appointment = await appointmentRepo.create(
    {
      client: { connect: { id: user.id } },
      barber: { connect: { id: user.id } },
      unit: { connect: { id: user.unitId } },
      date: new Date('2024-06-01'),
      status: 'SCHEDULED',
    },
    [
      {
        id: 'svc-appt',
        name: '',
        description: null,
        imageUrl: null,
        cost: 0,
        price: 30,
        categoryId: 'cat-1',
        defaultTime: null,
        commissionPercentage: null,
        unitId: user.unitId,
      },
    ],
  )
  appointmentRepo.appointments[0].services[0].id = 'aps1'

  const sale2 = { ...makeSaleWithBarber(), id: 's2', paymentStatus: 'PAID' }
  sale2.items[0].id = 'it2'
  sale2.items[0].barberId = user.id
  sale2.items[0].serviceId = 'svc-appt'
  sale2.items[0].appointmentId = appointment.id
  sale2.items[0].appointment = appointmentRepo.appointments[0]
  sale2.items[0].porcentagemBarbeiro = 50
  ;(sale2.items[0] as any).commissionPaid = false
  saleRepo.sales.push(sale2 as any)

  const apptSvc = appointmentRepo.appointments[0].services[0]

  appointmentRepo.appointments[0].services[0].commissionPercentage = 50

  return {
    saleItemId: sale.items[0].id,
    appointmentServiceId: apptSvc.id,
  }
}

describe('Pay user commission service', () => {
  beforeEach(async () => {
    await setup()
  })

  it('pays multiple items and marks them as paid', async () => {
    await makePaymentItems()

    const preview = await service.preview(user.id)
    expect(preview.total.toNumber()).toBe(35)
    expect(preview.items).toHaveLength(2)

    const res = await service.execute({
      actorId: user.id,
      affectedUserId: user.id,
      description: 'pay',
      amount: Money.from(35),
      reason: TransactionReason.PAY_COMMISSION,
    })

    expect(res.transactions).toHaveLength(2)
    expect(profileRepo.profiles[0].totalBalance).toBe(65)
    expect((saleRepo.sales[0].items[0] as any).commissionPaid).toBe(true)
    expect(appointmentRepo.appointments[0].services[0].commissionPaid).toBe(
      true,
    )
  })

  it('handles partial payments', async () => {
    await makePaymentItems()

    const res = await service.execute({
      actorId: user.id,
      affectedUserId: user.id,
      description: '',
      amount: Money.from(25),
      reason: TransactionReason.PAY_COMMISSION,
    })

    expect(res.transactions).toHaveLength(2)
    expect(profileRepo.profiles[0].totalBalance).toBe(75)
    expect((saleRepo.sales[0].items[0] as any).commissionPaid).toBe(true)
    expect(appointmentRepo.appointments[0].services[0].commissionPaid).toBe(
      false,
    )
  })

  it('rejects negative totals', async () => {
    await expect(
      service.execute({
        actorId: user.id,
        affectedUserId: user.id,
        description: '',
        amount: Money.from(-5),
        reason: TransactionReason.PAY_COMMISSION,
      }),
    ).rejects.toBeInstanceOf(NegativeValuesNotAllowedError)
  })
})
