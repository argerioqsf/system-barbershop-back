import { InMemoryCashRegisterRepository as BaseCashRegisterRepository } from '../../src/repositories/in-memory/in-memory-cash-register-repository'
import type { Transaction, Sale } from '@prisma/client'
import type { CompleteCashSession } from '../../src/repositories/cash-register-repository'
import { InMemoryProfilesRepository } from '../../src/repositories/in-memory/in-memory-profiles-repository'
import { Profile, User } from '@prisma/client'
export { InMemoryServiceRepository as FakeServiceRepository } from '../../src/repositories/in-memory/in-memory-service-repository'
export { InMemoryBarberServiceRepository as FakeBarberServiceRelRepository } from '../../src/repositories/in-memory/in-memory-barber-service-repository'
export { InMemoryBarberProductRepository as FakeBarberProductRepository } from '../../src/repositories/in-memory/in-memory-barber-product-repository'
export { InMemoryProductRepository as FakeProductRepository } from '../../src/repositories/in-memory/in-memory-product-repository'
export { InMemoryCouponRepository as FakeCouponRepository } from '../../src/repositories/in-memory/in-memory-coupon-repository'
export { InMemoryBarberUsersRepository } from '../../src/repositories/in-memory/in-memory-barber-users-repository'
export { InMemoryBarberUsersRepository as FakeBarberUsersRepository } from '../../src/repositories/in-memory/in-memory-barber-users-repository'
export { InMemoryPermissionRepository } from '../../src/repositories/in-memory/in-memory-permission-repository'
export { InMemoryRoleRepository } from '../../src/repositories/in-memory/in-memory-role-repository'
export { InMemoryCashRegisterRepository } from '../../src/repositories/in-memory/in-memory-cash-register-repository'
export { InMemoryTransactionRepository as FakeTransactionRepository } from '../../src/repositories/in-memory/in-memory-transaction-repository'
export { InMemoryOrganizationRepository as FakeOrganizationRepository } from '../../src/repositories/in-memory/in-memory-organization-repository'

export class FakeProfilesRepository extends InMemoryProfilesRepository {
  private _profiles: (Profile & {
    user: Omit<User, 'password'>
    permissions: { id: string; name: string }[]
  })[] = []

  constructor(
    profiles: (Profile & {
      user: Omit<User, 'password'>
      permissions: { id: string; name: string }[]
    })[] = [],
  ) {
    super()
    this._profiles = profiles
    this.items = profiles
  }

  get profiles(): (Profile & {
    user: Omit<User, 'password'>
    permissions: { id: string; name: string }[]
  })[] {
    return this._profiles
  }

  set profiles(
    profiles: (Profile & {
      user: Omit<User, 'password'>
      permissions: { id: string; name: string }[]
    })[],
  ) {
    this._profiles = profiles
    this.items = profiles
  }
}

export class FakeCashRegisterRepository extends BaseCashRegisterRepository {
  private _session:
    | (CompleteCashSession & {
        transactions: Transaction[]
        sales: Sale[]
      })
    | null = null

  constructor(
    session?:
      | (CompleteCashSession & {
          transactions: Transaction[]
          sales: Sale[]
        })
      | null,
  ) {
    super()
    if (session) {
      this.session = session
    }
  }

  get session():
    | (CompleteCashSession & {
        transactions: Transaction[]
        sales: Sale[]
      })
    | null {
    return this._session
  }

  set session(
    value:
      | (CompleteCashSession & {
          transactions: Transaction[]
          sales: Sale[]
        })
      | null,
  ) {
    this._session = value
    this.sessions = value ? [value] : []
  }
}
export { InMemoryUnitRepository as FakeUnitRepository } from '../../src/repositories/in-memory/in-memory-unit-repository'
export { InMemorySaleRepository as FakeSaleRepository } from '../../src/repositories/in-memory/in-memory-sale-repository'
export { InMemoryPasswordResetTokenRepository as FakePasswordResetTokenRepository } from '../../src/repositories/in-memory/in-memory-password-reset-token-repository'
export { InMemoryAppointmentRepository as FakeAppointmentRepository } from '../../src/repositories/in-memory/in-memory-appointment-repository'
export { InMemoryUnitOpeningHourRepository as FakeUnitOpeningHourRepository } from '../../src/repositories/in-memory/in-memory-unit-opening-hour-repository'
export { InMemoryProfileWorkHourRepository as FakeProfileWorkHourRepository } from '../../src/repositories/in-memory/in-memory-profile-work-hour-repository'
export { InMemoryProfileBlockedHourRepository as FakeProfileBlockedHourRepository } from '../../src/repositories/in-memory/in-memory-profile-blocked-hour-repository'
export { InMemoryAppointmentServiceRepository as FakeAppointmentServiceRepository } from '../../src/repositories/in-memory/in-memory-appointment-service-repository'
export { InMemorySaleItemRepository as FakeSaleItemRepository } from '../../src/repositories/in-memory/in-memory-sale-item-repository'
export { InMemoryLoanRequestRepository as FakeLoanRequestRepository } from '../../src/repositories/in-memory/in-memory-loan-request-repository'
