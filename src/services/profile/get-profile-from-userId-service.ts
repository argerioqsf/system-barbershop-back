import { ProfilesRepository } from '@/repositories/profiles-repository'
import {
  Profile,
  User,
  Unit,
  ProfileWorkHour,
  ProfileBlockedHour,
} from '@prisma/client'
import { ResourceNotFoundError } from '../@errors/common/resource-not-found-error'

interface GetUserProfileServiceRequest {
  id: string
}

interface GetUserProfileServiceResponse {
  profile:
    | (Profile & {
        user: Omit<User, 'password'> & { unit: Unit }
        permissions: { id: string; name: string }[]
        workHours: ProfileWorkHour[]
        blockedHours: ProfileBlockedHour[]
      })
    | null
}

export class GetUserProfileFromUserIdService {
  constructor(private profileRepository: ProfilesRepository) {}

  async execute({
    id,
  }: GetUserProfileServiceRequest): Promise<GetUserProfileServiceResponse> {
    const profile = await this.profileRepository.findByUserId(id)

    if (!profile) {
      throw new ResourceNotFoundError()
    }

    return {
      profile,
    }
  }
}
