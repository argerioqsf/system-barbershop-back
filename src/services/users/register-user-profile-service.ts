import { ProfilesRepository } from '@/repositories/profiles-repository'
import { UnitConsultantRepository } from '@/repositories/unit-consultant-repository'
import { UnitRepository } from '@/repositories/unit-repository'
import { UsersRepository } from '@/repositories/users-repository'
import { Profile, Role, User } from '@prisma/client'
import { hash } from 'bcryptjs'
import { UnitNotFoundError } from '../@errors/unit-not-found-error'
import { UserAlreadyExistsError } from '../@errors/user-already-exists-error'
import { UserTypeNotCompatible } from '../@errors/user-type-not-compatible'

interface registerCasesRequest {
  name: string
  email: string
  password: string
  active: boolean
  phone: string
  cpf: string
  genre: string
  birthday: string
  pix: string
  role: Role
  city: string
  unitsIds?: string[] | null
}

interface RegisterUserProfileServiceResponse {
  user: User
  profile: Profile
}

export class RegisterUserProfileService {
  constructor(
    private usersRepository: UsersRepository,
    private profileRepository: ProfilesRepository,
    private unitConsultantRepository: UnitConsultantRepository,
    private unitRepository: UnitRepository,
  ) {}

  async execute({
    name,
    email,
    password,
    active,
    phone,
    cpf,
    genre,
    birthday,
    pix,
    role,
    city,
    unitsIds,
  }: registerCasesRequest): Promise<RegisterUserProfileServiceResponse> {
    const password_hash = await hash(password, 6)

    const userWithSameEmail = await this.usersRepository.findByEmail(email)

    if (userWithSameEmail) {
      throw new UserAlreadyExistsError()
    }

    if (unitsIds) {
      if (role === 'consultant') {
        const units = await this.unitRepository.findManyListIds(unitsIds)

        if (units.length !== unitsIds.length) {
          throw new UnitNotFoundError()
        }
      } else {
        throw new UserTypeNotCompatible()
      }
    }

    const user = await this.usersRepository.create({
      name,
      email,
      password: password_hash,
      active,
    })

    const profile = await this.profileRepository.create({
      phone,
      cpf,
      genre,
      birthday,
      pix,
      role,
      userId: user.id,
      city,
      amountToReceive: 0,
    })

    if (unitsIds) {
      await this.unitConsultantRepository.createMany(profile.id, unitsIds)
    }

    return {
      user,
      profile,
    }
  }
}
