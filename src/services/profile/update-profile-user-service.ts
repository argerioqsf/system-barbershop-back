import { ProfilesRepository } from '@/repositories/profiles-repository'
import { UsersRepository } from '@/repositories/users-repository'
import { Profile, Role, User } from '@prisma/client'
import { UserNotFoundError } from '../@errors/user-not-found-error'
import { ProfileNotFoundError } from '../@errors/profile-not-found-error'

interface UpdateProfileUserRequest {
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
}

interface UpdateProfileUserResponse {
  user: Omit<User, 'password'>
  profile: Profile
}

export class UpdateProfileUserService {
  constructor(
    private usersRepository: UsersRepository,
    private profilesRepository: ProfilesRepository,
  ) {}

  async execute(
    data: UpdateProfileUserRequest,
  ): Promise<UpdateProfileUserResponse> {
    const user = await this.usersRepository.findById(data.id)
    if (!user) {
      throw new UserNotFoundError()
    }

    const profile = await this.profilesRepository.findByUserId(data.id)
    if (!profile) {
      throw new ProfileNotFoundError()
    }

    await this.usersRepository.update(data.id, {
      name: data.name,
      email: data.email,
      active: data.active,
    })

    const updatedProfile = await this.profilesRepository.update(profile.id, {
      phone: data.phone,
      cpf: data.cpf,
      genre: data.genre,
      birthday: data.birthday,
      pix: data.pix,
      role: data.role,
    })

    const updatedUser = await this.usersRepository.findById(data.id)
    return {
      user: updatedUser!,
      profile: updatedProfile,
    }
  }
}
