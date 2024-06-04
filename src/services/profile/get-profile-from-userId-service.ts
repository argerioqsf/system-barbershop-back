import { ProfilesRepository } from '@/repositories/profiles-repository'
import { ExtractProfile, Profile, User } from '@prisma/client'
import { ResourceNotFoundError } from '../@errors/resource-not-found-error'

interface GetUserProfileServiceRequest {
  id: string
}

interface GetUserProfileServiceResponse {
  profile:
    | (Omit<Profile, 'userId'> & {
        extract_profile: ExtractProfile[]
        user: Omit<User, 'password'>
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
