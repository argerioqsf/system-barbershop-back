import { Percentage } from '@/core/domain/value-objects/percentage'
// MIGRATION-TODO: Replace these Prisma types with domain entities when they are created.
import {
  BarberProduct,
  BarberService,
  Profile,
  Product,
  Service,
} from '@prisma/client'

export class CommissionResolutionService {
  getPercentage(
    source: Service | Product,
    profile: Profile,
    relation: BarberService | BarberProduct | null,
  ): Percentage {
    if (relation?.commissionPercentage) {
      return Percentage.from(relation.commissionPercentage)
    }
    if (profile.commissionPercentage) {
      return Percentage.from(profile.commissionPercentage)
    }
    if (source.commissionPercentage) {
      return Percentage.from(source.commissionPercentage)
    }
    return Percentage.from(0)
  }
}
