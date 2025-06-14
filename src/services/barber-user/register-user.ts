import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { UnitRepository } from '@/repositories/unit-repository'
import { Profile, Role, User } from '@prisma/client'
import { hash } from 'bcryptjs'

interface RegisterUserRequest {
  name: string
  email: string
  password: string
  phone: string
  cpf: string
  genre: string
  birthday: string
  pix: string
  role: Role
  unitId: string
}

interface RegisterUserResponse {
  user: User
  profile: Profile
}

export class RegisterUserService {
  constructor(
    private repository: BarberUsersRepository,
    private unitRepository: UnitRepository,
  ) {}

  async execute(data: RegisterUserRequest): Promise<RegisterUserResponse> {
    const existing = await this.repository.findByEmail(data.email)
    if (existing) {
      throw new Error('User already exists')
    }
    const password_hash = await hash(data.password, 6)
    const unit = await this.unitRepository.findById(data.unitId)
    if (!unit) throw new Error('Unit not exists')

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
        role: data.role,
      },
    )

    return { user, profile }
  }
}
