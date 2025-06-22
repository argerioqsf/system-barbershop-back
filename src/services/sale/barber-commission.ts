import {
  BarberService,
  CommissionCalcType,
  Profile,
  Service,
} from '@prisma/client'

export function calculateBarberCommission(
  service: Service | null | undefined,
  profile: Profile | null | undefined,
  relation: BarberService | null | undefined,
): number | undefined {
  if (!profile) return undefined
  if (relation) {
    switch (relation.commissionType) {
      case CommissionCalcType.PERCENTAGE_OF_SERVICE:
        return service?.commissionPercentage ?? profile.commissionPercentage
      case CommissionCalcType.PERCENTAGE_OF_USER:
        return profile.commissionPercentage
      case CommissionCalcType.PERCENTAGE_OF_USER_SERVICE:
        return relation.commissionPercentage ?? profile.commissionPercentage
    }
  }
  return profile.commissionPercentage
}
