import {
  BarberService,
  CommissionCalcType,
  Profile,
  Service,
} from '@prisma/client'
import { BarberDoesNotHaveThisServiceError } from '../@errors/barber/barber-does-not-have-this-service'

export function calculateBarberCommission(
  service: Service | null | undefined,
  profile: Profile | null | undefined,
  relation: BarberService | null | undefined,
): number | undefined {
  if (!profile) return undefined
  if (relation) {
    if (service) {
      switch (relation.commissionType) {
        case CommissionCalcType.PERCENTAGE_OF_SERVICE:
          return service.commissionPercentage ?? 0
        case CommissionCalcType.PERCENTAGE_OF_USER:
          return profile.commissionPercentage
        case CommissionCalcType.PERCENTAGE_OF_USER_SERVICE:
          return relation.commissionPercentage ?? 0
      }
    }
    return 0
  } else {
    throw new BarberDoesNotHaveThisServiceError()
  }
}
