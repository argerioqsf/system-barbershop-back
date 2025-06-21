import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { PermissionRepository } from '@/repositories/permission-repository'
import { UnitRepository } from '@/repositories/unit-repository'
import { UserNotFoundError } from '@/services/@errors/user/user-not-found-error'
import { UnitNotExistsError } from '@/services/@errors/unit/unit-not-exists-error'
import { InvalidPermissionError } from '@/services/@errors/permission/invalid-permission-error'
import { Permission, Profile, Role, Unit, User } from '@prisma/client'
import { hasPermission } from '@/utils/permissions'
import { UnauthorizedError } from '../@errors/auth/unauthorized-error'
import { UserToken } from '@/http/controllers/authenticate-controller'
import { FastifyReply, FastifyRequest } from 'fastify'

interface UpdateUserRequest {
  id: string
  name?: string
  phone?: string
  cpf?: string
  genre?: string
  birthday?: string
  pix?: string
  roleId?: string
  permissions?: string[]
  active?: boolean
  email?: string
  unitId?: string
  commissionPercentage?: number
}

type OldUser =
  | (User & {
      profile: (Profile & { role: Role; permissions: Permission[] }) | null
      unit: Unit | null
    })
  | null

export interface UpdateUserResponse {
  user: Omit<User, 'password'>
  profile: Profile | null
}

export class UpdateUserService {
  constructor(
    private repository: BarberUsersRepository,
    private unitRepository: UnitRepository,
    private permissionRepository: PermissionRepository,
  ) {}

  private async verifyPermissions(user: OldUser, userToken?: UserToken) {
    if (user && user.profile && userToken?.role !== 'ADMIN') {
      const permissions = userToken?.permissions
      if (
        user.profile.role.name === 'OWNER' &&
        !hasPermission(['UPDATE_USER_OWNER'], permissions)
      ) {
        throw new UnauthorizedError()
      }
      if (
        user.profile.role.name === 'ADMIN' &&
        !hasPermission(['UPDATE_USER_ADMIN'], permissions)
      ) {
        throw new UnauthorizedError()
      }
    }
  }

  private handleChangeCredentials(
    oldUser: OldUser,
    data: { roleId?: string; unitId?: string; permissions?: string[] },
  ): boolean {
    const oldPermissions =
      oldUser?.profile?.permissions?.map((permission) => permission.id) ?? []
    const changedRole = data.roleId
      ? data?.roleId !== oldUser?.profile?.roleId
      : false
    const changedUnit = data?.unitId ? data?.unitId !== oldUser?.unitId : false
    const changedPermission = !data.permissions?.every((permission) =>
      oldPermissions.includes(permission),
    )

    return changedRole || changedUnit || !!changedPermission
  }

  async execute(
    data: UpdateUserRequest,
    userToken?: UserToken,
    reply?: FastifyReply,
    request?: FastifyRequest,
  ): Promise<UpdateUserResponse> {
    const oldUser = await this.repository.findById(data.id)
    if (!oldUser) {
      throw new UserNotFoundError()
    }
    await this.verifyPermissions(oldUser, userToken)

    let unit: Unit | undefined
    if (data.unitId) {
      unit = (await this.unitRepository.findById(data.unitId)) ?? undefined
      if (!unit) throw new UnitNotExistsError()
    }

    let permissionIds: string[] | undefined
    if (data.permissions) {
      const roleId = data.roleId ?? oldUser.profile?.roleId
      if (!roleId) throw new InvalidPermissionError()
      const allowed = await this.permissionRepository.findManyByRole(roleId)
      const allowedIds = allowed.map((p) => p.id)
      // TODO: criar um erro expecifico para o if a baixo e nao esse, criar que faça sentido
      if (!data.permissions.every((id) => allowedIds.includes(id))) {
        throw new InvalidPermissionError()
      }
      permissionIds = data.permissions
    }

    const changeCredentials = this.handleChangeCredentials(oldUser, data)

    const { user, profile } = await this.repository.update(
      data.id,
      {
        name: data.name,
        email: data.email,
        active: data.active,
        ...(unit && {
          organization: { connect: { id: unit.organizationId } },
        }),
        ...(unit && { unit: { connect: { id: unit.id } } }),
        ...(changeCredentials && { versionToken: { increment: 1 } }),
        ...(changeCredentials &&
          userToken?.sub === data.id && {
            versionTokenInvalidate: userToken.versionToken,
          }),
      },
      {
        phone: data.phone,
        cpf: data.cpf,
        genre: data.genre,
        birthday: data.birthday,
        pix: data.pix,
        roleId: data.roleId,
        commissionPercentage: data.commissionPercentage,
      },
      permissionIds,
    )

    if (
      userToken &&
      reply &&
      request &&
      data.id === userToken.sub &&
      changeCredentials
    ) {
      const permissions = profile?.permissions.map(
        (permission) => permission.name,
      )
      const newToken = await reply.jwtSign(
        {
          unitId: user.unitId,
          organizationId: user.organizationId,
          role: profile?.role?.name ?? userToken.role,
          permissions,
          versionToken: user.versionToken,
        },
        { sign: { sub: user.id } },
      )
      request.newToken = newToken
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userRest } = user
    return { user: userRest, profile }
  }
}
