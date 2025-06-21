import { PermissionName, Unit } from '@prisma/client'
import { PermissionDeniedError } from '@/services/@errors/permission/permission-denied-error'
import { UnitRepository } from '@/repositories/unit-repository'

export function hasPermission(
  permissionsRequired: PermissionName[],
  permissionsUser?: PermissionName[],
): boolean {
  if (!permissionsUser) return false
  const userHavePermission = permissionsRequired.every((p) =>
    permissionsUser.includes(p),
  )
  return userHavePermission
}

export function assertPermission(
  permissionsRequired: PermissionName[],
  permissionsUser?: PermissionName[],
): void {
  if (!hasPermission(permissionsRequired, permissionsUser)) {
    throw new PermissionDeniedError()
  }
}

export interface DataScope {
  organizationId?: string
  unitId?: string
}

export function getScope(user: {
  role: string
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
