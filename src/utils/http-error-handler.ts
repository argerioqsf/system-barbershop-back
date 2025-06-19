import { InvalidCredentialsError } from '@/services/@errors/invalid-credentials-error'
import { UserInactiveError } from '@/services/@errors/user-inactive-error'
import { UserNotFoundError } from '@/services/@errors/user-not-found-error'
import { ResourceNotFoundError } from '@/services/@errors/resource-not-found-error'
import { UnitNotFoundError } from '@/services/@errors/unit-not-found-error'
import { UserAlreadyExistsError } from '@/services/@errors/user-already-exists-error'
import { ProfileNotFoundError } from '@/services/@errors/profile-not-found-error'
import { OrganizationNotFoundError } from '@/services/@errors/organization-not-found-error'
import { UnitNotExistsError } from '@/services/@errors/unit-not-exists-error'
import { CashRegisterClosedError } from '@/services/@errors/cash-register-closed-error'
import { CashRegisterNotOpenedError } from '@/services/@errors/cash-register-not-opened-error'
import { CashRegisterAlreadyOpenError } from '@/services/@errors/cash-register-already-open-error'
import { CouponNotFoundError } from '@/services/@errors/coupon-not-found-error'
import { InsufficientStockError } from '@/services/@errors/insufficient-stock-error'
import { ItemNeedsServiceOrProductError } from '@/services/@errors/item-needs-service-or-product-error'
import { NegativeValuesNotAllowedError } from '@/services/@errors/negative-values-not-allowed-error'
import { InsufficientBalanceError } from '@/services/@errors/insufficient-balance-error'
import { WithdrawalGreaterThanUnitBalanceError } from '@/services/@errors/withdrawal-greater-than-unit-balance-error'
import { AffectedUserNotFoundError } from '@/services/@errors/affected-user-not-found-error'
import { SaleNotFoundError } from '@/services/@errors/sale-not-found-error'
import { SessionNotFoundError } from '@/services/@errors/session-not-found-error'
import { ServiceNotFoundError } from '@/services/@errors/service-not-found-error'
import { ProductNotFoundError } from '@/services/@errors/product-not-found-error'
import { BarberNotFoundError } from '@/services/@errors/barber-not-found-error'
import { BarberProfileNotFoundError } from '@/services/@errors/barber-profile-not-found-error'
import { OwnerNotFoundError } from '@/services/@errors/owner-not-found-error'
import { UnitNotFromOrganizationError } from '@/services/users/set-user-unit'
import { FastifyReply, FastifyRequest } from 'fastify'

export function mapErrorToStatus(error: Error): number {
  if (
    error instanceof InvalidCredentialsError ||
    error instanceof UserInactiveError ||
    error instanceof UnitNotFromOrganizationError ||
    error instanceof CashRegisterClosedError ||
    error instanceof CashRegisterNotOpenedError ||
    error instanceof CashRegisterAlreadyOpenError ||
    error instanceof NegativeValuesNotAllowedError ||
    error instanceof InsufficientBalanceError ||
    error instanceof WithdrawalGreaterThanUnitBalanceError ||
    error instanceof InsufficientStockError ||
    error instanceof ItemNeedsServiceOrProductError
  ) {
    return 400
  }

  if (
    error instanceof ResourceNotFoundError ||
    error instanceof UnitNotFoundError ||
    error instanceof UserNotFoundError ||
    error instanceof ProfileNotFoundError ||
    error instanceof OrganizationNotFoundError ||
    error instanceof UnitNotExistsError ||
    error instanceof CouponNotFoundError ||
    error instanceof SaleNotFoundError ||
    error instanceof SessionNotFoundError ||
    error instanceof ServiceNotFoundError ||
    error instanceof ProductNotFoundError ||
    error instanceof AffectedUserNotFoundError ||
    error instanceof BarberNotFoundError ||
    error instanceof BarberProfileNotFoundError ||
    error instanceof OwnerNotFoundError
  ) {
    return 404
  }

  if (error instanceof UserAlreadyExistsError) return 409

  return 500
}

export function handleControllerError(error: unknown, reply: FastifyReply) {
  if (error instanceof Error) {
    const status = mapErrorToStatus(error)
    return reply.status(status).send({ message: error.message })
  }
  return reply.status(500).send({ message: 'Internal server error' })
}
export function withErrorHandling(
  fn: (request: FastifyRequest, reply: FastifyReply) => Promise<unknown>,
) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      return await fn(request, reply)
    } catch (error) {
      return handleControllerError(error, reply)
    }
  }
}
