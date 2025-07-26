import {
  PlanProfileRepository,
  PlanProfileWithDebts,
} from '@/repositories/plan-profile-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { Prisma } from '@prisma/client'

export async function findUserIdsLinkedToPlans(
  planIds: string[],
  planProfileRepository: PlanProfileRepository,
  profilesRepository: ProfilesRepository,
  tx?: Prisma.TransactionClient,
): Promise<string[]> {
  let planProfiles: PlanProfileWithDebts[] = []
  for (const planId of planIds) {
    const profilesPart = await planProfileRepository.findMany({ planId }, tx)
    planProfiles = planProfiles.concat(profilesPart)
  }

  const uniqueProfileIds = Array.from(
    new Set(planProfiles.map((pp) => pp.profileId)),
  )

  const profiles = await Promise.all(
    uniqueProfileIds.map((pid) => profilesRepository.findById(pid)),
  )

  return profiles.map((p) => p?.user.id).filter((u): u is string => !!u)
}
