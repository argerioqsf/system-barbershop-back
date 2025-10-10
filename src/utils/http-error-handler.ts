import { InvalidCredentialsError } from '@/services/@errors/auth/invalid-credentials-error'
import { UserInactiveError } from '@/services/@errors/user/user-inactive-error'
import { UserNotFoundError } from '@/services/@errors/user/user-not-found-error'
import { ResourceNotFoundError } from '@/services/@errors/common/resource-not-found-error'
import { UnitNotFoundError } from '@/services/@errors/unit/unit-not-found-error'
import { UserAlreadyExistsError } from '@/services/@errors/user/user-already-exists-error'
import { ProfileNotFoundError } from '@/services/@errors/profile/profile-not-found-error'
import { OrganizationNotFoundError } from '@/services/@errors/organization/organization-not-found-error'
import { UnitNotExistsError } from '@/services/@errors/unit/unit-not-exists-error'
import { CashRegisterClosedError } from '@/services/@errors/cash-register/cash-register-closed-error'
import { CashRegisterNotOpenedError } from '@/services/@errors/cash-register/cash-register-not-opened-error'
import { CashRegisterAlreadyOpenError } from '@/services/@errors/cash-register/cash-register-already-open-error'
import { CouponNotFoundError } from '@/services/@errors/coupon/coupon-not-found-error'
import { InsufficientStockError } from '@/services/@errors/product/insufficient-stock-error'
import { ItemNeedsServiceOrProductOrAppointmentError } from '@/services/@errors/sale/item-needs-service-or-product-error'
import { NegativeValuesNotAllowedError } from '@/services/@errors/transaction/negative-values-not-allowed-error'
import { InsufficientBalanceError } from '@/services/@errors/transaction/insufficient-balance-error'
import { WithdrawalGreaterThanUnitBalanceError } from '@/services/@errors/transaction/withdrawal-greater-than-unit-balance-error'
import { AffectedUserNotFoundError } from '@/services/@errors/transaction/affected-user-not-found-error'
import { SaleNotFoundError } from '@/services/@errors/sale/sale-not-found-error'
import { SessionNotFoundError } from '@/services/@errors/cash-register/session-not-found-error'
import { ServiceNotFoundError } from '@/services/@errors/service/service-not-found-error'
import { ProductNotFoundError } from '@/services/@errors/product/product-not-found-error'
import { BarberNotFoundError } from '@/services/@errors/barber/barber-not-found-error'
import { BarberProfileNotFoundError } from '@/services/@errors/profile/barber-profile-not-found-error'
import { OwnerNotFoundError } from '@/services/@errors/organization/owner-not-found-error'
import { UnitNotFromOrganizationError } from '@/services/users/set-user-unit'
import { FastifyReply } from 'fastify'
import { ItemPriceGreaterError } from '@/services/@errors/sale/Item-price-greater-error'
import { InvalidAppointmentStatusError } from '@/services/@errors/appointment/invalid-appointment-status-error'
import { CannotEditPaidSaleError } from '@/services/@errors/sale/cannot-edit-paid-sale-error'
import { LoanPaymentGreaterThanRemainingError } from '@/services/@errors/loan/loan-payment-greater-than-remaining-error'
import { CollaboratorNotFoundError } from '@/modules/collaborator/application/errors/collaborator-not-found.error'
import { UnauthorizedAccessError } from '@/modules/collaborator/application/errors/unauthorized-access.error'
import { PlanNotFromUserUnitError } from '@/services/@errors/plan/plan-not-from-user-unit-error'

export function mapErrorToStatus(error: Error): number {
  if (
    error instanceof InvalidCredentialsError ||
    error instanceof UnauthorizedAccessError ||
    error instanceof UserInactiveError ||
    error instanceof UnitNotFromOrganizationError ||
    error instanceof CashRegisterClosedError ||
    error instanceof CashRegisterNotOpenedError ||
    error instanceof CashRegisterAlreadyOpenError ||
    error instanceof NegativeValuesNotAllowedError ||
    error instanceof InsufficientBalanceError ||
    error instanceof WithdrawalGreaterThanUnitBalanceError ||
    error instanceof InsufficientStockError ||
    error instanceof ItemNeedsServiceOrProductOrAppointmentError ||
    error instanceof ItemPriceGreaterError ||
    error instanceof InvalidAppointmentStatusError ||
    error instanceof CannotEditPaidSaleError ||
    error instanceof LoanPaymentGreaterThanRemainingError ||
    error instanceof PlanNotFromUserUnitError
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
    error instanceof CollaboratorNotFoundError ||
    error instanceof OwnerNotFoundError
  ) {
    return 404
  }

  if (error instanceof UserAlreadyExistsError) return 409

  return 500
}

export function handleControllerError(error: Error, reply: FastifyReply) {
  const status = mapErrorToStatus(error)
  return reply.status(status).send({ message: error.message })
}
