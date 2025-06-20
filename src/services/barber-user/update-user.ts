import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { PermissionRepository } from '@/repositories/permission-repository'
import { UnitRepository } from '@/repositories/unit-repository'
import { UserNotFoundError } from '@/services/@errors/user/user-not-found-error'
import { UnitNotExistsError } from '@/services/@errors/unit/unit-not-exists-error'
import { InvalidPermissionError } from '@/services/@errors/permission/invalid-permission-error'
import { Permission, Profile, Role, Unit, User } from '@prisma/client'
import { hasPermission } from '@/utils/permissions'
import { UnauthorizedError } from '../@errors/auth/unauthorized-error'

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
  profile: (Profile & { role: Role; permissions: Permission[] }) | null
  oldUser: OldUser
}

export class UpdateUserService {
  constructor(
    private repository: BarberUsersRepository,
    private unitRepository: UnitRepository,
    private permissionRepository: PermissionRepository,
  ) {}

  private async verifyPermissions(data: UpdateUserRequest, user: OldUser) {
    if (user && user.profile) {
      if (
        user.profile.role.name === 'OWNER' &&
        hasPermission(['UPDATE_USER_OWNER'])
      ) {
        throw new UnauthorizedError()
      }
      if (
        user.profile.role.name === 'ADMIN' &&
        hasPermission(['UPDATE_USER_ADMIN'])
      ) {
        throw new UnauthorizedError()
      }
    }
  }

  async execute(data: UpdateUserRequest): Promise<UpdateUserResponse> {
    const oldUser = await this.repository.findById(data.id)
    if (!oldUser) {
      throw new UserNotFoundError()
    }
    this.verifyPermissions(data, oldUser)

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
      if (!data.permissions.every((id) => allowedIds.includes(id))) {
        throw new InvalidPermissionError()
      }
      permissionIds = data.permissions
    }

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userRest } = user
    return { user: userRest, profile, oldUser }
  }
}
