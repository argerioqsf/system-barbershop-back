import { ProfilesRepository } from '@/repositories/profiles-repository'
import { Profile, User } from '@prisma/client'
import { ResourceNotFoundError } from '../@errors/resource-not-found-error'

interface GetUserProfileServiceRequest {
  id: string
}

interface GetUserProfileServiceResponse {
  profile: Profile & { user: User }
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
