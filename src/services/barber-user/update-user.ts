import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { UnitRepository } from '@/repositories/unit-repository'
import { UserNotFoundError } from '@/services/@errors/user/user-not-found-error'
import { UnitNotExistsError } from '@/services/@errors/unit/unit-not-exists-error'
import { Profile, Role, Unit, User } from '@prisma/client'

interface UpdateUserRequest {
  id: string
  name?: string
  phone?: string
  cpf?: string
  genre?: string
  birthday?: string
  pix?: string
  role?: Role
  roleModelId?: string
  active?: boolean
  email?: string
  unitId?: string
  commissionPercentage?: number
}

interface UpdateUserResponse {
  user: User
  profile: Profile | null
}

export class UpdateUserService {
  constructor(
    private repository: BarberUsersRepository,
    private unitRepository: UnitRepository,
  ) {}

  async execute(data: UpdateUserRequest): Promise<UpdateUserResponse> {
    const existing = await this.repository.findById(data.id)
    if (!existing) {
      throw new UserNotFoundError()
    }
    let unit: Unit | undefined
    if (data.unitId) {
      unit = (await this.unitRepository.findById(data.unitId)) ?? undefined
      if (!unit) throw new UnitNotExistsError()
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
        role: data.role,
        roleModelId: data.roleModelId,
        commissionPercentage: data.commissionPercentage,
      },
    )

    return { user, profile }
  }
}
