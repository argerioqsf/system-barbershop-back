import { InMemoryCashRegisterRepository as BaseCashRegisterRepository } from '../../src/repositories/in-memory/in-memory-cash-register-repository'
import type { CashRegisterSession, Transaction, Sale } from '@prisma/client'
import type { CompleteCashSession } from '../../src/repositories/cash-register-repository'
import { InMemoryProfilesRepository } from '../../src/repositories/in-memory/in-memory-profiles-repository'
import { Profile, User } from '@prisma/client'
export { InMemoryServiceRepository as FakeServiceRepository } from '../../src/repositories/in-memory/in-memory-service-repository'
export { InMemoryProductRepository as FakeProductRepository } from '../../src/repositories/in-memory/in-memory-product-repository'
export { InMemoryCouponRepository as FakeCouponRepository } from '../../src/repositories/in-memory/in-memory-coupon-repository'
export { InMemoryBarberUsersRepository } from '../../src/repositories/in-memory/in-memory-barber-users-repository'
export { InMemoryBarberUsersRepository as FakeBarberUsersRepository } from '../../src/repositories/in-memory/in-memory-barber-users-repository'
export { InMemoryCashRegisterRepository } from '../../src/repositories/in-memory/in-memory-cash-register-repository'
export { InMemoryTransactionRepository as FakeTransactionRepository } from '../../src/repositories/in-memory/in-memory-transaction-repository'
export { InMemoryOrganizationRepository as FakeOrganizationRepository } from '../../src/repositories/in-memory/in-memory-organization-repository'

export class FakeProfilesRepository extends InMemoryProfilesRepository {
  constructor(
    public profiles: (Profile & { user: Omit<User, 'password'> })[] = [],
  ) {
    super()
    this.items = profiles
  }
}

export class FakeCashRegisterRepository extends BaseCashRegisterRepository {
  private _session:
    | (CompleteCashSession & { transactions: Transaction[]; sales: Sale[] })
    | null = null

  constructor(
    session?:
      | (CashRegisterSession & { transactions: Transaction[]; sales: Sale[] })
      | null,
  ) {
    super()
    if (session) {
      this.session = session
    }
  }

  get session():
    | (CompleteCashSession & { transactions: Transaction[]; sales: Sale[] })
    | null {
    return this._session
  }

  set session(
    value:
      | (CashRegisterSession & { transactions: Transaction[]; sales: Sale[] })
      | null,
  ) {
    this._session = value as any
    this.sessions = value ? [value as any] : []
  }
}
export { InMemoryUnitRepository as FakeUnitRepository } from '../../src/repositories/in-memory/in-memory-unit-repository'
export { InMemorySaleRepository as FakeSaleRepository } from '../../src/repositories/in-memory/in-memory-sale-repository'
export { InMemoryPasswordResetTokenRepository as FakePasswordResetTokenRepository } from '../../src/repositories/in-memory/in-memory-password-reset-token-repository'
export { InMemoryAppointmentRepository } from '../../src/repositories/in-memory/in-memory-appointment-repository'
