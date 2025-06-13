import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { Profile, Role, User } from '@prisma/client'

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
}

interface UpdateUserResponse {
  user: User
  profile: Profile | null
}

export class UpdateUserService {
  constructor(private repository: BarberUsersRepository) {}

  async execute(data: UpdateUserRequest): Promise<UpdateUserResponse> {
    const existing = await this.repository.findById(data.id)
    if (!existing) {
      throw new Error('User not found')
    }

    const { user, profile } = await this.repository.update(
      data.id,
      {
        name: data.name,
        email: data.email,
        active: data.active,
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
