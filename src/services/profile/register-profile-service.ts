import { ProfilesRepository } from '@/repositories/profiles-repository'
import { UsersRepository } from '@/repositories/users-repository'
import { Profile, Role } from '@prisma/client'
import { UserNotFoundError } from '../@errors/user/user-not-found-error'

interface CreateProfileServiceRequest {
  phone: string
  cpf: string
  genre: string
  birthday: string
  pix: string
  role: Role
  roleModelId: string
  userId: string
}

interface CreateProfileServiceResponse {
  profile: Profile
}

export class CreateProfileService {
  constructor(
    private userRepository: UsersRepository,
    private profileRepository: ProfilesRepository,
  ) {}

  async execute({
    phone,
    cpf,
    genre,
    birthday,
    pix,
    role,
    roleModelId,
    userId,
  }: CreateProfileServiceRequest): Promise<CreateProfileServiceResponse> {
    const user = await this.userRepository.findById(userId)

    if (!user) {
      throw new UserNotFoundError()
    }

    const profile = await this.profileRepository.create({
      phone,
      cpf,
      genre,
      birthday,
      pix,
      role,
      roleModelId,
      userId,
    })

    return { profile }
  }
}
