import { UsersRepository } from '@/repositories/users-repository'
import { Profile, Role, User } from '@prisma/client'
import { hash } from 'bcryptjs'
import { UserAlreadyExistsError } from './errors/user-already-exists-error'
import { ProfilesRepository } from '@/repositories/profiles-repository'

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
}

interface RegisterUserProfileServiceResponse {
  user: User
  profile: Profile
}

export class RegisterUserProfileService {
  constructor(
    private usersRepository: UsersRepository,
    private profileRepository: ProfilesRepository,
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
  }: registerCasesRequest): Promise<RegisterUserProfileServiceResponse> {
    const password_hash = await hash(password, 6)

    const userWithSameEmail = await this.usersRepository.findByEmail(email)

    if (userWithSameEmail) {
      throw new UserAlreadyExistsError()
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
    })

    return {
      user,
      profile,
    }
  }
}
