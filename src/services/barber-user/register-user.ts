import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { PermissionRepository } from '@/repositories/permission-repository'
import { UnitRepository } from '@/repositories/unit-repository'
import { Profile, User } from '@prisma/client'
import type { Role } from '@/@types/roles'
import { hash } from 'bcryptjs'
import { UserAlreadyExistsError } from '@/services/@errors/user/user-already-exists-error'
import { UnitNotExistsError } from '@/services/@errors/unit/unit-not-exists-error'
import { InvalidPermissionError } from '../@errors/permission/invalid-permission-error'

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
  ) {}

  async execute(data: RegisterUserRequest): Promise<RegisterUserResponse> {
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
