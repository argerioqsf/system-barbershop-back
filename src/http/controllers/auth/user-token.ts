import { PermissionName, RoleName } from '@prisma/client'

export interface UserToken {
  unitId: string
  organizationId: string
  role: RoleName
  sub: string
  permissions?: PermissionName[]
  versionToken?: number
  tokenType?: 'access' | 'refresh'
}
