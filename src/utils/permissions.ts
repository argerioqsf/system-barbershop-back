import { Role, Unit } from '@prisma/client'
import { PermissionDeniedError } from '@/services/@errors/permission/permission-denied-error'
import { UnitRepository } from '@/repositories/unit-repository'

export const FEATURES = {
  // UNIT
  LIST_UNITS: ['ADMIN', 'OWNER', 'BARBER', 'MANAGER', 'ATTENDANT'] as Role[],
  LIST_ALL_UNITS: ['ADMIN'] as Role[],
  LIST_ORG_UNIT: ['OWNER', 'BARBER', 'MANAGER', 'ATTENDANT'] as Role[],
  CREATE_UNIT: ['ADMIN'] as Role[],
  // SERVICES
  LIST_SERVICES: ['ADMIN', 'OWNER', 'BARBER', 'MANAGER', 'ATTENDANT'] as Role[],
  LIST_TRANSACTIONS: [
    'ADMIN',
    'OWNER',
    'BARBER',
    'MANAGER',
    'ATTENDANT',
  ] as Role[],
  LIST_ORGANIZATIONS: [
    'ADMIN',
    'OWNER',
    'BARBER',
    'MANAGER',
    'ATTENDANT',
  ] as Role[],
  LIST_PRODUCTS: ['ADMIN', 'OWNER', 'BARBER', 'MANAGER', 'ATTENDANT'] as Role[],
  LIST_APPOINTMENTS: [
    'ADMIN',
    'OWNER',
    'BARBER',
    'MANAGER',
    'ATTENDANT',
  ] as Role[],
  LIST_USERS: ['ADMIN', 'OWNER', 'BARBER', 'MANAGER'] as Role[],
  LIST_COUPONS: ['ADMIN', 'OWNER', 'BARBER', 'MANAGER', 'ATTENDANT'] as Role[],
  LIST_CASH_SESSIONS: [
    'ADMIN',
    'OWNER',
    'BARBER',
    'MANAGER',
    'ATTENDANT',
  ] as Role[],
  LIST_SALES: ['ADMIN', 'OWNER', 'BARBER', 'MANAGER', 'ATTENDANT'] as Role[],
  MANAGE_USER_TRANSACTION_WITHDRAWAL: [
    'ADMIN',
    'OWNER',
    'MANAGER',
    'BARBER',
  ] as Role[],
  MANAGE_USER_TRANSACTION_ADD: ['ADMIN', 'OWNER', 'MANAGER'] as Role[],
  MANAGE_OTHER_USER_TRANSACTION: ['ADMIN', 'OWNER', 'MANAGER'] as Role[],
} as const

export type Feature = keyof typeof FEATURES

export function hasPermission(role: Role, feature: Feature): boolean {
  return FEATURES[feature].includes(role)
}

export function assertPermission(role: Role, feature: Feature): void {
  if (!hasPermission(role, feature)) {
    throw new PermissionDeniedError()
  }
}

export interface DataScope {
  organizationId?: string
  unitId?: string
}

export function getScope(user: {
  role: Role
  organizationId: string
  unitId: string
}): DataScope {
  if (user.role === 'ADMIN') {
    return {}
  }
  if (user.role === 'OWNER') {
    return { organizationId: user.organizationId }
  }
  return { unitId: user.unitId }
}

export function buildUnitWhere(scope: DataScope) {
  if (scope.organizationId) {
    return { unit: { organizationId: scope.organizationId } }
  }
  if (scope.unitId) {
    return { unitId: scope.unitId }
  }
  return {}
}

export async function listUnitsByScope(
  repository: UnitRepository,
  scope: DataScope,
): Promise<Unit[]> {
  if (scope.organizationId) {
    return repository.findManyByOrganization(scope.organizationId)
  }

  if (scope.unitId) {
    const unit = await repository.findById(scope.unitId)
    return unit ? [unit] : []
  }

  return repository.findMany()
}
