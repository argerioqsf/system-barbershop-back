import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { PermissionRepository } from '@/repositories/permission-repository'
import { UnitRepository } from '@/repositories/unit-repository'
import { Profile, RoleName, User, PermissionName } from '@prisma/client'
import { hash } from 'bcryptjs'
import { UserAlreadyExistsError } from '@/services/@errors/user/user-already-exists-error'
import { UnitNotExistsError } from '@/services/@errors/unit/unit-not-exists-error'
import { InvalidPermissionError } from '../@errors/permission/invalid-permission-error'
import { RolesNotFoundError } from '../@errors/role/role-not-found-error'
import { RoleRepository } from '@/repositories/role-repository'
import { UserToken } from '@/http/controllers/authenticate-controller'
import { UnauthorizedError } from '../@errors/auth/unauthorized-error'
import { assertPermission, hasPermission } from '@/utils/permissions'
import { PermissionDeniedError } from '../@errors/permission/permission-denied-error'

interface RegisterUserRequest {
  name: string
  email: string
  password: string
  phone: string
  cpf: string
  genre: string
  birthday: string
  pix: string
  roleId: string
  unitId: string
  permissions?: string[]
}

interface RegisterUserResponse {
  user: User
  profile: Profile
}

export class RegisterUserService {
  constructor(
    private repository: BarberUsersRepository,
    private unitRepository: UnitRepository,
    private permissionRepository: PermissionRepository,
    private roleRepository: RoleRepository,
  ) {}

  async execute(
    userToken: UserToken,
    data: RegisterUserRequest,
  ): Promise<RegisterUserResponse> {
    const role = await this.roleRepository.findById(data.roleId)
    if (!role) {
      throw new RolesNotFoundError()
    }

    if (role?.name === RoleName.ADMIN && userToken.role !== 'ADMIN') {
      throw new UnauthorizedError()
    }

    if (userToken.role !== 'ADMIN') {
      switch (role.name) {
        case RoleName.OWNER:
          await assertPermission(
            [PermissionName.CREATE_USER_OWNER],
            userToken.permissions,
          )
          break
        case RoleName.MANAGER:
          await assertPermission(
            [PermissionName.CREATE_USER_MANAGER],
            userToken.permissions,
          )
          break
        case RoleName.ATTENDANT:
          await assertPermission(
            [PermissionName.CREATE_USER_ATTENDANT],
            userToken.permissions,
          )
          break
        case RoleName.BARBER:
          await assertPermission(
            [PermissionName.CREATE_USER_BARBER],
            userToken.permissions,
          )
          break
        case RoleName.CLIENT:
          await assertPermission(
            [PermissionName.CREATE_USER_CLIENT],
            userToken.permissions,
          )
          break
      }
    } else if (role?.name === RoleName.CLIENT) {
      await assertPermission(
        [PermissionName.CREATE_USER_CLIENT],
        userToken.permissions,
      )
    }

    const existing = await this.repository.findByEmail(data.email)
    if (existing) {
      throw new UserAlreadyExistsError()
    }
    const password_hash = await hash(data.password, 6)
    const unit = await this.unitRepository.findById(data.unitId)
    if (!unit) throw new UnitNotExistsError()

    let permissionIds: string[] | undefined
    if (data.permissions) {
      const allowed = await this.permissionRepository.findManyByRole(
        data.roleId,
      )
      const allowedIds = allowed.map((p) => p.id)
      if (!data.permissions.every((id) => allowedIds.includes(id))) {
        throw new InvalidPermissionError()
      }
      permissionIds = data.permissions
    }

    const { user, profile } = await this.repository.create(
      {
        name: data.name,
        email: data.email,
        password: password_hash,
        active: false,
        organization: { connect: { id: unit.organizationId } },
        unit: { connect: { id: unit.id } },
      },
      {
        phone: data.phone,
        cpf: data.cpf,
        genre: data.genre,
        birthday: data.birthday,
        pix: data.pix,
        roleId: data.roleId,
      },
      permissionIds,
    )

    return { user, profile }
  }
}
