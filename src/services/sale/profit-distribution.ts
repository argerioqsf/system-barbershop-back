import { DistributeProfitsDeps } from './types'
import { IncrementBalanceUnitService } from '../unit/increment-balance'
import { IncrementBalanceProfileService } from '../profile/increment-balance'
import { IncrementBalanceOrganizationService } from '../organization/increment-balance'

import { DetailedSale } from '@/repositories/sale-repository'

export async function distributeProfits(
  sale: DetailedSale,
  organizationId: string,
  userId: string,
  {
    organizationRepository,
    profileRepository,
    unitRepository,
    transactionRepository,
  }: DistributeProfitsDeps & {
    transactionRepository: import('@/repositories/transaction-repository').TransactionRepository
  },
): Promise<void> {
  const org = await organizationRepository.findById(organizationId)
  if (!org) throw new Error('Org not found')

  const incrementUnit = new IncrementBalanceUnitService(
    unitRepository,
    transactionRepository,
  )
  const incrementProfile = new IncrementBalanceProfileService(
    profileRepository,
    transactionRepository,
  )
  const incrementOrg = new IncrementBalanceOrganizationService(
    organizationRepository,
    transactionRepository,
  )

  const barberTotals: Record<string, number> = {}
  let ownerShare = 0
  for (const item of sale.items) {
    const value = item.price ?? 0
    if (item.product) {
      ownerShare += value
    } else if (item.barberId) {
      const perc = item.porcentagemBarbeiro ?? 100
      const valueBarber = (value * perc) / 100
      barberTotals[item.barberId] =
        (barberTotals[item.barberId] || 0) + valueBarber
      ownerShare += value - valueBarber
    } else {
      ownerShare += value
    }
  }
  for (const [barberId, amount] of Object.entries(barberTotals)) {
    const userBarber = sale.items.find((item) => item.barber?.id === barberId)
    if (!userBarber) throw new Error('Barber not found')
    if (
      userBarber &&
      userBarber.barber &&
      userBarber.barber.profile &&
      userBarber.barber.profile.totalBalance < 0
    ) {
      const balanceBarber = userBarber.barber.profile.totalBalance
      const valueCalculated = balanceBarber + amount
      if (valueCalculated <= 0) {
        await incrementUnit.execute(
          sale.unitId,
          userId,
          sale.sessionId!,
          amount,
          sale.id,
        )
      } else {
        await incrementUnit.execute(
          sale.unitId,
          userId,
          sale.sessionId!,
          balanceBarber * -1,
          sale.id,
        )
        await incrementOrg.execute(
          org.id,
          userId,
          sale.unitId,
          sale.sessionId!,
          balanceBarber * -1,
          sale.id,
        )
      }
    }
    await incrementProfile.execute(barberId, sale.sessionId!, amount, sale.id)
  }

  await incrementUnit.execute(
    sale.unitId,
    userId,
    sale.sessionId!,
    ownerShare,
    sale.id,
  )
  await incrementOrg.execute(
    org.id,
    userId,
    sale.unitId,
    sale.sessionId!,
    ownerShare,
    sale.id,
  )
}
