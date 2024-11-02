import { UsersRepository } from '@/repositories/users-repository'
import { Profile } from '@prisma/client'
import { UserNotFoundError } from '../@errors/user-not-found-error'
import { sendContractEmail } from '@/lib/sendgrid'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { ProfileNotFoundError } from '../@errors/profile-not-found-error'

interface SentContractServiceRequest {
  id: string
  contractLink: string
}

interface SentContractServiceResponse {
  profile: Profile | null
}

export class SentContractService {
  constructor(
    private userRepository: UsersRepository,
    private profileRepository: ProfilesRepository,
  ) {}

  async execute({
    id,
    contractLink,
  }: SentContractServiceRequest): Promise<SentContractServiceResponse> {
    const findUser = await this.userRepository.findById(id)

    if (!findUser) throw new UserNotFoundError()

    if (!findUser.profile) throw new ProfileNotFoundError()

    const resp = await sendContractEmail(
      findUser.email,
      findUser.name,
      contractLink,
    )

    let profileUpdate = null

    if (resp) {
      profileUpdate = await this.profileRepository.update(findUser.profile.id, {
        contractLink,
        contractSent: true,
      })
    }

    return {
      profile: profileUpdate,
    }
  }
}
