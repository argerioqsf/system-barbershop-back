import { ProfilesRepository } from '@/repositories/profiles-repository'
import { UsersRepository } from '@/repositories/users-repository'
import { Profile, Role, User } from '@prisma/client'

interface UpdateProfileUserServiceRequest {
  id: string
  name: string
  email: string
  active: boolean
  phone: string
  cpf: string
  genre: string
  birthday: string
  pix: string
  role: Role
  city: string
}

interface UpdateProfileUserServiceResponse {
  user: User
  profile: Profile
}

export class UpdateProfileUserService {
  constructor(
    private usersRepository: UsersRepository,
    private profileRepository: ProfilesRepository,
  ) {}

  async execute({
    id,
    name,
    email,
    active,
    phone,
    cpf,
    genre,
    birthday,
    pix,
    role,
    city,
  }: UpdateProfileUserServiceRequest): Promise<UpdateProfileUserServiceResponse> {
    const profile = await this.profileRepository.update(id, {
      phone,
      cpf,
      genre,
      birthday,
      pix,
      role,
      city,
    })

    const user = await this.usersRepository.update(profile.userId, {
      name,
      email,
      active,
    })

    return {
      user,
      profile,
    }
  }
}
