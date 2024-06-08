import { ProfilesRepository } from '@/repositories/profiles-repository'
import { UsersRepository } from '@/repositories/users-repository'
import { Profile, User } from '@prisma/client'
import { hash } from 'bcryptjs'
import { UserAlreadyExistsError } from '../@errors/user-already-exists-error'
import { sendCreateIndicatorEmail } from '@/lib/sendgrid'

interface RegisterIndicatorServiceRequest {
  name: string
  email: string
  password: string
  active: boolean
  phone: string
  cpf: string
  genre: string
  birthday: string
  pix: string
}

interface RegisterIndicatorServiceResponse {
  user: User
  profile: Profile
}

export class RegisterIndicatorProfileService {
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
  }: RegisterIndicatorServiceRequest): Promise<RegisterIndicatorServiceResponse> {
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
      role: 'indicator',
      userId: user.id,
    })

    sendCreateIndicatorEmail(email, name)

    return {
      user,
      profile,
    }
  }
}
