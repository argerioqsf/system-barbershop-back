import { ProfilesRepository } from '@/repositories/profiles-repository'
import { UsersRepository } from '@/repositories/users-repository'
import { Profile, Role, User } from '@prisma/client'
import { UserNotFoundError } from '../@errors/user-not-found-error'
import { ResourceNotFoundError } from '../@errors/resource-not-found-error'
import { UnitRepository } from '@/repositories/unit-repository'
import { UnitNotFoundError } from '../@errors/unit-not-found-error'

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
    private unitRepository: UnitRepository,
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
    const user = await this.usersRepository.findById(id)
    const unit = await this.unitRepository.findById(id)
    if (!user) throw new UserNotFoundError()

    if (!unit) throw new UnitNotFoundError()

    if (!user.profile) throw new ResourceNotFoundError()

    const profile = await this.profileRepository.update(user.profile.id, {
      phone,
      cpf,
      genre,
      birthday,
      pix,
      role,
      city,
    })

    const userUpdate = await this.usersRepository.update(profile.userId, {
      name,
      email,
      active,
    })

    return {
      user: userUpdate,
      profile,
    }
  }
}
