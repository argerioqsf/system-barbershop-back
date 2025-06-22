import {
  BarberProduct,
  CommissionCalcType,
  Profile,
  Product,
} from '@prisma/client'
import { BarberDoesNotHaveThisProductError } from '../@errors/barber/barber-does-not-have-this-product'

export function calculateBarberProductCommission(
  product: Product | null | undefined,
  profile: Profile | null | undefined,
  relation: BarberProduct | null | undefined,
): number | undefined {
  if (!profile) return undefined
  if (relation) {
    if (product) {
      switch (relation.commissionType) {
        case CommissionCalcType.PERCENTAGE_OF_SERVICE:
          return 0
        case CommissionCalcType.PERCENTAGE_OF_USER:
          return profile.commissionPercentage
        case CommissionCalcType.PERCENTAGE_OF_USER_SERVICE:
          return relation.commissionPercentage ?? 0
      }
    }
    return 0
  }
  throw new BarberDoesNotHaveThisProductError()
}
