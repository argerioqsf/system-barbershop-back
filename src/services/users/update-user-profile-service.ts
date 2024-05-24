import { ProfilesRepository } from '@/repositories/profiles-repository'
import { UnitConsultantRepository } from '@/repositories/unit-consultant-repository'
import { UnitRepository } from '@/repositories/unit-repository'
import { UsersRepository } from '@/repositories/users-repository'
import { Profile, Role, User } from '@prisma/client'
import { ResourceNotFoundError } from '../@errors/resource-not-found-error'
import { UserNotFoundError } from '../@errors/user-not-found-error'
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
  unitsIds?: string[]
}

interface UpdateProfileUserServiceResponse {
  user: User
  profile: Profile
}

export class UpdateProfileUserService {
  constructor(
    private usersRepository: UsersRepository,
    private profileRepository: ProfilesRepository,
    private unitConsultantRepository: UnitConsultantRepository,
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
    unitsIds,
  }: UpdateProfileUserServiceRequest): Promise<UpdateProfileUserServiceResponse> {
    const user = await this.usersRepository.findById(id)

    const units = unitsIds
      ? await this.unitRepository.findManyListIds(unitsIds)
      : []

    if (units.length !== unitsIds?.length) {
      throw new UnitNotFoundError()
    }

    if (!user) throw new UserNotFoundError()

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

    const addUnitsIds = unitsIds?.filter((id) => {
      const existUnit = user.profile?.units.filter(
        (unit) => unit.unit.id === id,
      )
      if (existUnit && existUnit?.length > 0) return false
      return true
    })

    const removeUnitsIds = user.profile.units
      .filter((unit) => {
        const existUnits = unitsIds?.filter((id) => unit.unit.id === id)
        if (existUnits && existUnits?.length > 0) return false
        return true
      })
      .map((unit) => unit.unit.id)

    if (removeUnitsIds.length > 0) {
      await this.unitConsultantRepository.deleteMany(
        user.profile.id,
        removeUnitsIds,
      )
    }

    await this.unitConsultantRepository.createMany(profile.id, addUnitsIds)

    return {
      user: userUpdate,
      profile,
    }
  }
}
