import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PayUserCommissionService } from '../../../src/services/transaction/pay-user-comission'
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
import type { PaymentItems } from '../../../src/services/users/utils/calculatePendingCommissions'
import { IncrementBalanceProfileService } from '../../../src/services/profile/increment-balance'

let service: PayUserCommissionService
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

  service = new PayUserCommissionService(
    profileRepo,
    saleItemRepo,
    appointmentServiceRepo,
    incrementBalanceProfileService,
  )
}

async function makePaymentItems(): Promise<PaymentItems[]> {
  const sale = { ...makeSaleWithBarber(), id: 's1', paymentStatus: 'PAID' }
  sale.items[0].id = 'it1'
  sale.items[0].barberId = user.id
  sale.items[0].serviceId = 'svc1'
  sale.items[0].price = 40
  sale.items[0].porcentagemBarbeiro = user.profile!.commissionPercentage
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
  sale2.items[0].porcentagemBarbeiro = user.profile!.commissionPercentage
  ;(sale2.items[0] as any).commissionPaid = false
  saleRepo.sales.push(sale2 as any)

  const apptSvc = appointmentRepo.appointments[0].services[0]

  const apptRecord: PaymentItems = {
    saleId: sale2.id,
    saleItemId: sale2.items[0].id,
    appointmentServiceId: apptSvc.id,
    amount: 15,
    item: sale2.items[0] as any,
    service: apptSvc.service,
    sale: sale2 as any,
    transactions: [],
  }

  return [saleRecord, apptRecord]
}

describe('Pay user commission service', () => {
  beforeEach(async () => {
    await setup()
  })

  it('pays multiple items and marks them as paid', async () => {
    const items = await makePaymentItems()

    const res = await service.execute({
      commissionToBePaid: 35,
      userId: user.id,
      affectedUserId: user.id,
      description: 'pay',
      allUserUnpaidSalesItemsFormatted: items,
    })

    expect(res.transactions).toHaveLength(2)
    expect(profileRepo.profiles[0].totalBalance).toBe(65)
    expect((saleRepo.sales[0].items[0] as any).commissionPaid).toBe(true)
    expect(appointmentRepo.appointments[0].services[0].commissionPaid).toBe(
      true,
    )
  })

  it('handles partial payments', async () => {
    const items = await makePaymentItems()

    const res = await service.execute({
      commissionToBePaid: 25,
      userId: user.id,
      affectedUserId: user.id,
      description: '',
      allUserUnpaidSalesItemsFormatted: items,
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
        commissionToBePaid: -5,
        userId: user.id,
        affectedUserId: user.id,
        description: '',
        allUserUnpaidSalesItemsFormatted: [],
      }),
    ).rejects.toThrow('Negative values not allowed')
  })
})
