import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { UnitRepository } from '@/repositories/unit-repository'
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
      throw new Error('User not found')
    }
    let unit: Unit | undefined
    if (data.unitId) {
      unit = (await this.unitRepository.findById(data.unitId)) ?? undefined
      if (!unit) throw new Error('Unit not exists')
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
        commissionPercentage: data.commissionPercentage,
      },
    )

    return { user, profile }
  }
}
