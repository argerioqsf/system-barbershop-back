import { ExtractProfileRepository } from '@/repositories/extract-profile-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { ExtractProfile, Profile } from '@prisma/client'
import { ProfileNotFoundError } from '../@errors/profile-not-found-error'

interface ConfirmPaymentServiceRequest {
  id: string
}

interface ConfirmPaymentServiceResponse {
  profile: Profile
  extract: ExtractProfile
}

export class ConfirmPaymentService {
  constructor(private profileRepository: ProfilesRepository) {}

  async execute({
    id,
  }: ConfirmPaymentServiceRequest): Promise<ConfirmPaymentServiceResponse> {
    const profile = await this.profileRepository.findByUserId(id)

    if (!profile) throw new ProfileNotFoundError()

    const { profile: profileUp, extract } =
      await this.profileRepository.confirmPayment(
        profile.id,
        {
          amountToReceive: 0,
        },
        {
          amount_receive: profile.amountToReceive ?? 0,
          profileId: profile.id,
        },
      )

    return {
      profile: profileUp,
      extract,
    }
  }
}
