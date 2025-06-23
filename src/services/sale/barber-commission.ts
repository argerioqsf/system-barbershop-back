import {
  BarberService,
  CommissionCalcType,
  Product,
  Profile,
  Service,
} from '@prisma/client'
import { BarberDoesNotHaveThisServiceError } from '../@errors/barber/barber-does-not-have-this-service'

export function calculateBarberCommission(
  item: Service | Product | null | undefined,
  profile: Profile | null | undefined,
  relation: BarberService | BarberProduct | null | undefined,
): number | undefined {
  if (!profile) return undefined
  if (relation) {
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
  } else {
    throw new BarberDoesNotHaveThisServiceError()
  }
}
