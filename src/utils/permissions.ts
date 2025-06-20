import { Role, Unit } from '@prisma/client'
import { PermissionDeniedError } from '@/services/@errors/permission/permission-denied-error'
import { UnitRepository } from '@/repositories/unit-repository'
import { getProfileFromUserIdService } from '@/services/@factories/profile/get-profile-from-userId-service'

export const FEATURES = {
  LIST_UNITS: ['LIST_UNITS'],
  LIST_ALL_UNITS: ['LIST_ALL_UNITS'],
  LIST_ORG_UNIT: ['LIST_ORG_UNIT'],
  CREATE_UNIT: ['CREATE_UNIT'],
  LIST_SERVICES: ['LIST_SERVICES'],
  LIST_TRANSACTIONS: ['LIST_TRANSACTIONS'],
  LIST_ORGANIZATIONS: ['LIST_ORGANIZATIONS'],
  LIST_PRODUCTS: ['LIST_PRODUCTS'],
  LIST_APPOINTMENTS: ['LIST_APPOINTMENTS'],
  LIST_USERS: ['LIST_USERS'],
  LIST_COUPONS: ['LIST_COUPONS'],
  LIST_CASH_SESSIONS: ['LIST_CASH_SESSIONS'],
  LIST_SALES: ['LIST_SALES'],
  MANAGE_USER_TRANSACTION_WITHDRAWAL: ['MANAGE_USER_TRANSACTION_WITHDRAWAL'],
  MANAGE_USER_TRANSACTION_ADD: ['MANAGE_USER_TRANSACTION_ADD'],
  MANAGE_OTHER_USER_TRANSACTION: ['MANAGE_OTHER_USER_TRANSACTION'],
  LIST_ROLES: ['LIST_ROLES'],
  LIST_PERMISSIONS: ['LIST_PERMISSIONS'],
} as const

export type Feature = keyof typeof FEATURES

async function getPermissionsFromUserId(userId: string): Promise<string[]> {
  const service = getProfileFromUserIdService()
  const { profile } = await service.execute({ id: userId })
  return profile.permissions.map((p) => p.name)
}

export async function hasPermission(
  userId: string,
  feature: Feature,
): Promise<boolean> {
  const permissions = await getPermissionsFromUserId(userId)
  return FEATURES[feature].some((p) => permissions.includes(p))
}

export async function assertPermission(
  userId: string,
  feature: Feature,
): Promise<void> {
  if (!(await hasPermission(userId, feature))) {
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
