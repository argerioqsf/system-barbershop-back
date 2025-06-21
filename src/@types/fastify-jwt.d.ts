import '@fastify/jwt'
import { PermissionName, RoleName } from '@prisma/client'

declare module '@fastify/jwt' {
  export interface FastifyJWT {
    user: {
      sub: string
      unitId: string
      organizationId: string
      role: RoleName
      permissions?: PermissionName[]
      versionToken?: number
    }
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    newToken?: string
  }
}
