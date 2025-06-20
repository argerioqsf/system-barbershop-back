import { ProfilesRepository } from '@/repositories/profiles-repository'
import { UsersRepository } from '@/repositories/users-repository'
import { PermissionRepository } from '@/repositories/permission-repository'
import { Profile } from '@prisma/client'
import { UserNotFoundError } from '../@errors/user/user-not-found-error'
import { InvalidPermissionError } from '../@errors/permission/invalid-permission-error'

interface CreateProfileServiceRequest {
  phone: string
  cpf: string
  genre: string
  birthday: string
  pix: string
  roleId: string
  userId: string
  permissions?: string[]
}

interface CreateProfileServiceResponse {
  profile: Profile
}

export class CreateProfileService {
  constructor(
    private userRepository: UsersRepository,
    private profileRepository: ProfilesRepository,
    private permissionRepository: PermissionRepository,
  ) {}

  async execute({
    phone,
    cpf,
    genre,
    birthday,
    pix,
    roleId,
    userId,
    permissions,
  }: CreateProfileServiceRequest): Promise<CreateProfileServiceResponse> {
    const user = await this.userRepository.findById(userId)

    if (!user) {
      throw new UserNotFoundError()
    }

    let permissionIds: string[] | undefined
    if (permissions) {
      const allowed = await this.permissionRepository.findManyByRole(roleId)
      const allowedIds = allowed.map((p) => p.id)
      if (!permissions.every((id) => allowedIds.includes(id))) {
        throw new InvalidPermissionError()
      }
      permissionIds = permissions
    }

    const profile = await this.profileRepository.create(
      {
        phone,
        cpf,
        genre,
        birthday,
        pix,
        roleId,
        userId,
      },
      permissionIds,
    )

    return { profile }
  }
}
