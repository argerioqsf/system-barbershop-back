import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { BarberServiceRepository } from '@/repositories/barber-service-repository'
import { BarberProductRepository } from '@/repositories/barber-product-repository'
import { PermissionRepository } from '@/repositories/permission-repository'
import { UnitRepository } from '@/repositories/unit-repository'
import { UserNotFoundError } from '@/services/@errors/user/user-not-found-error'
import { UnitNotExistsError } from '@/services/@errors/unit/unit-not-exists-error'
import { InvalidPermissionError } from '@/services/@errors/permission/invalid-permission-error'
import { PermissionsNotAllowedError } from '@/services/@errors/permission/permissions-not-allowed-error'
import { Permission, Profile, Role, Unit, User } from '@prisma/client'
import { hasPermission } from '@/utils/permissions'
import { UnauthorizedError } from '../@errors/auth/unauthorized-error'
import { UserToken } from '@/http/controllers/authenticate-controller'
import { FastifyReply, FastifyRequest } from 'fastify'
import { logger } from '@/lib/logger'

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
  services?: Array<{
    serviceId: string
    time?: number | null
    commissionPercentage?: number | undefined
    commissionType?:
      | 'PERCENTAGE_OF_ITEM'
      | 'PERCENTAGE_OF_USER'
      | 'PERCENTAGE_OF_USER_ITEM'
      | undefined
  }>
  products?: Array<{
    productId: string
    commissionPercentage?: number | undefined
    commissionType?:
      | 'PERCENTAGE_OF_ITEM'
      | 'PERCENTAGE_OF_USER'
      | 'PERCENTAGE_OF_USER_ITEM'
      | undefined
  }>
  removeServiceIds?: string[]
  removeProductIds?: string[]
}

type OldUser =
  | (Omit<User, 'password'> & {
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
    private barberServiceRepository: BarberServiceRepository,
    private barberProductRepository: BarberProductRepository,
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

    // TODO: verificar se a role a ser adicionada no usuario editad pertence a
    // unidade de quem esta criando esse usuario
    let permissionIds: string[] | undefined
    if (data.permissions) {
      const roleId = data.roleId ?? oldUser.profile?.roleId
      if (!roleId) throw new InvalidPermissionError()
      const allowed = await this.permissionRepository.findManyByRole(roleId)
      const allowedIds = allowed.map((p) => p.id)
      if (!data.permissions.every((id) => allowedIds.includes(id))) {
        throw new PermissionsNotAllowedError()
      }
      permissionIds = data.permissions
    } else if (
      data.roleId &&
      oldUser.profile &&
      data.roleId !== oldUser.profile.roleId
    ) {
      permissionIds = []
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
        // ...(changeCredentials &&
        //   userToken?.sub === data.id && {
        //     versionTokenInvalidate: userToken.versionToken,
        //   }),
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

    // Vincular/atualizar serviços/produtos do barbeiro
    if (profile) {
      if (data.services && data.services.length > 0) {
        for (const s of data.services) {
          const exists =
            await this.barberServiceRepository.findByProfileService(
              profile.id,
              s.serviceId,
            )
          logger.debug('exists barberService', { exists })
          if (exists) {
            await this.barberServiceRepository.update(profile.id, s.serviceId, {
              time: s.time ?? undefined,
              commissionPercentage: s.commissionPercentage,
              commissionType: s.commissionType,
            })
          } else {
            await this.barberServiceRepository.create({
              profileId: profile.id,
              serviceId: s.serviceId,
              time: s.time ?? undefined,
              commissionPercentage: s.commissionPercentage,
              commissionType: s.commissionType,
            })
          }
        }
      }

      if (data.products && data.products.length > 0) {
        for (const p of data.products) {
          const exists =
            await this.barberProductRepository.findByProfileProduct(
              profile.id,
              p.productId,
            )
          logger.debug('exists barberProduct', { exists })
          if (exists) {
            await this.barberProductRepository.update(profile.id, p.productId, {
              commissionPercentage: p.commissionPercentage,
              commissionType: p.commissionType,
            })
          } else {
            await this.barberProductRepository.create({
              profileId: profile.id,
              productId: p.productId,
              commissionPercentage: p.commissionPercentage,
              commissionType: p.commissionType,
            })
          }
        }
      }

      // removals
      if (data.removeServiceIds && data.removeServiceIds.length > 0) {
        for (const serviceId of data.removeServiceIds) {
          await this.barberServiceRepository.deleteByProfileService(
            profile.id,
            serviceId,
          )
        }
      }
      if (data.removeProductIds && data.removeProductIds.length > 0) {
        for (const productId of data.removeProductIds) {
          await this.barberProductRepository.deleteByProfileProduct(
            profile.id,
            productId,
          )
        }
      }
    }

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

    const userRest = { ...user }
    delete (userRest as { password?: string }).password
    return { user: userRest, profile }
  }
}
