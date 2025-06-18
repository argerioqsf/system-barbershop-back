import { DistributeProfitsDeps } from './types'
import { IncrementBalanceUnitService } from '../unit/increment-balance'
import { IncrementBalanceProfileService } from '../profile/increment-balance'

import { DetailedSale } from '@/repositories/sale-repository'
import { Transaction } from '@prisma/client'

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
): Promise<{ transactions: Transaction[] }> {
  const org = await organizationRepository.findById(organizationId)
  if (!org) throw new Error('Org not found')

  if (!sale.sessionId) throw new Error('Session not found')

  const transactions: Transaction[] = []

  const incrementUnit = new IncrementBalanceUnitService(
    unitRepository,
    transactionRepository,
  )
  const incrementProfile = new IncrementBalanceProfileService(
    profileRepository,
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
      const amountToPay = valueCalculated <= 0 ? amount : -balanceBarber
      const transactionUnit = await incrementUnit.execute(
        sale.unitId,
        barberId,
        amountToPay,
        sale.id,
        amountToPay,
      )
      transactions.push(transactionUnit.transaction)
    }
    const transactionProfile = await incrementProfile.execute(
      barberId,
      amount,
      sale.id,
      undefined,
    )
    transactions.push(transactionProfile.transaction)
  }

  const transactionUnit = await incrementUnit.execute(
    sale.unitId,
    userId,
    ownerShare,
    sale.id,
  )
  transactions.push(transactionUnit.transaction)

  return { transactions }
}
