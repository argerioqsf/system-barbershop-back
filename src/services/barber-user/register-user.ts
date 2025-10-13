import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { BarberServiceRepository } from '@/repositories/barber-service-repository'
import { BarberProductRepository } from '@/repositories/barber-product-repository'
import { PermissionRepository } from '@/repositories/permission-repository'
import { UnitRepository } from '@/repositories/unit-repository'
import {
  Profile,
  RoleName,
  User,
  PermissionName,
  Role,
  CommissionCalcType,
} from '@prisma/client'
import { hash } from 'bcryptjs'
import { UserAlreadyExistsError } from '@/services/@errors/user/user-already-exists-error'
import { UnitNotExistsError } from '@/services/@errors/unit/unit-not-exists-error'
import { InvalidPermissionError } from '../@errors/permission/invalid-permission-error'
import { RolesNotFoundError } from '../@errors/role/role-not-found-error'
import { RoleRepository } from '@/repositories/role-repository'
import { UserToken } from '@/http/controllers/authenticate-controller'
import { UnauthorizedError } from '../@errors/auth/unauthorized-error'
import { assertPermission } from '@/utils/permissions'
import { PermissionDeniedError } from '../@errors/permission/permission-denied-error'

interface RegisterUserRequest {
  name: string
  email: string
  password: string
  phone?: string
  cpf?: string
  genre?: string
  birthday?: string
  pix?: string
  roleId: string
  unitId: string
  permissions?: string[]
  commissionPercentage?: number
  services?: Array<{
    serviceId: string
    time?: number | null
    commissionPercentage?: number | null
    commissionType?:
      | 'PERCENTAGE_OF_ITEM'
      | 'PERCENTAGE_OF_USER'
      | 'PERCENTAGE_OF_USER_ITEM'
      | null
  }>
  products?: Array<{
    productId: string
    commissionPercentage?: number | null
    commissionType?:
      | 'PERCENTAGE_OF_ITEM'
      | 'PERCENTAGE_OF_USER'
      | 'PERCENTAGE_OF_USER_ITEM'
      | null
  }>
}

interface RegisterUserResponse {
  user: Omit<User, 'password'>
  profile: Profile
}

export class RegisterUserService {
  constructor(
    private repository: BarberUsersRepository,
    private unitRepository: UnitRepository,
    private permissionRepository: PermissionRepository,
    private roleRepository: RoleRepository,
    private barberServiceRepository: BarberServiceRepository,
    private barberProductRepository: BarberProductRepository,
  ) {}

  private async verifyPermissions(role: Role, userToken: UserToken) {
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
      case RoleName.ADMIN:
        await assertPermission(
          [PermissionName.CREATE_USER_ADMIN],
          userToken.permissions,
        )
        break
      default:
        throw new PermissionDeniedError()
    }
  }

  private async verifyEmailAlreadyExistsInOrganization(
    email: string,
    organizationId: string,
  ) {
    const userByEmailInOrganization = await this.repository.findMany({
      email,
      organizationId,
    })
    if (userByEmailInOrganization.length > 0) {
      throw new UserAlreadyExistsError()
    }
  }

  async execute(
    userToken: UserToken,
    data: RegisterUserRequest,
  ): Promise<RegisterUserResponse> {
    const role = await this.roleRepository.findById(data.roleId)
    if (!role) {
      throw new RolesNotFoundError()
    }

    await this.verifyPermissions(role, userToken)

    if (role?.name === RoleName.ADMIN && userToken.role !== 'ADMIN') {
      throw new UnauthorizedError()
    }
    await this.verifyEmailAlreadyExistsInOrganization(
      data.email,
      userToken.organizationId,
    )
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
        commissionPercentage: data.commissionPercentage ?? undefined,
      },
      permissionIds,
    )

    // vincular serviços e produtos (opcional)
    if (data.services && data.services.length > 0) {
      for (const s of data.services) {
        // evita violar unique
        const exists = await this.barberServiceRepository.findByProfileService(
          profile.id,
          s.serviceId,
        )
        if (exists) {
          await this.barberServiceRepository.update(profile.id, s.serviceId, {
            time: s.time ?? undefined,
            commissionPercentage: s.commissionPercentage ?? undefined,
            commissionType: s.commissionType ?? undefined,
          })
        } else {
          await this.barberServiceRepository.create({
            profileId: profile.id,
            serviceId: s.serviceId,
            time: s.time ?? undefined,
            commissionPercentage: s.commissionPercentage ?? undefined,
            commissionType: (s.commissionType ?? undefined) as
              | CommissionCalcType
              | undefined,
          })
        }
      }
    }

    if (data.products && data.products.length > 0) {
      for (const p of data.products) {
        const exists = await this.barberProductRepository.findByProfileProduct(
          profile.id,
          p.productId,
        )
        if (exists) {
          await this.barberProductRepository.update(profile.id, p.productId, {
            commissionPercentage: p.commissionPercentage ?? undefined,
            commissionType: p.commissionType ?? undefined,
          })
        } else {
          await this.barberProductRepository.create({
            profileId: profile.id,
            productId: p.productId,
            commissionPercentage: p.commissionPercentage ?? undefined,
            commissionType: (p.commissionType ?? undefined) as
              | CommissionCalcType
              | undefined,
          })
        }
      }
    }

    return { user, profile }
  }
}
