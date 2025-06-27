import {
  BarberService,
  BarberProduct,
  CommissionCalcType,
  Product,
  Profile,
  Service,
} from '@prisma/client'
import { ProfileNotFoundError } from '@/services/@errors/profile/profile-not-found-error'

export function calculateBarberCommission(
  item: Service | Product | null | undefined,
  profile: Profile | null | undefined,
  relation: BarberService | BarberProduct | null | undefined,
): number {
  if (!profile) throw new ProfileNotFoundError()
  if (!relation) {
    return profile.commissionPercentage
  }

  if (item) {
    switch (relation.commissionType) {
      case CommissionCalcType.PERCENTAGE_OF_ITEM:
        return item.commissionPercentage ?? 0
      case CommissionCalcType.PERCENTAGE_OF_USER:
        return profile.commissionPercentage
      case CommissionCalcType.PERCENTAGE_OF_USER_ITEM:
        return relation.commissionPercentage ?? 0
    }
  }

  return 0
}
