import { DistributeProfitsDeps } from './types'
import { TransactionType } from '@prisma/client'

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
        await unitRepository.incrementBalance(sale.unitId, amount)
        await transactionRepository.create({
          user: { connect: { id: userId } },
          unit: { connect: { id: sale.unitId } },
          session: { connect: { id: sale.sessionId! } },
          sale: { connect: { id: sale.id } },
          type: TransactionType.ADDITION,
          description: 'Sale',
          amount,
        })
      } else {
        await unitRepository.incrementBalance(sale.unitId, balanceBarber * -1)
        await transactionRepository.create({
          user: { connect: { id: userId } },
          unit: { connect: { id: sale.unitId } },
          session: { connect: { id: sale.sessionId! } },
          sale: { connect: { id: sale.id } },
          type: TransactionType.ADDITION,
          description: 'Sale',
          amount: balanceBarber * -1,
        })
        await organizationRepository.incrementBalance(
          org.id,
          balanceBarber * -1,
        )
        await transactionRepository.create({
          user: { connect: { id: userId } },
          unit: { connect: { id: sale.unitId } },
          session: { connect: { id: sale.sessionId! } },
          sale: { connect: { id: sale.id } },
          type: TransactionType.ADDITION,
          description: 'Sale',
          amount: balanceBarber * -1,
        })
      }
    }
    await profileRepository.incrementBalance(barberId, amount)
    await transactionRepository.create({
      user: { connect: { id: barberId } },
      unit: { connect: { id: sale.unitId } },
      session: { connect: { id: sale.sessionId! } },
      sale: { connect: { id: sale.id } },
      type: TransactionType.ADDITION,
      description: 'Sale',
      amount,
    })
  }
  await unitRepository.incrementBalance(sale.unitId, ownerShare)
  await transactionRepository.create({
    user: { connect: { id: userId } },
    unit: { connect: { id: sale.unitId } },
    session: { connect: { id: sale.sessionId! } },
    sale: { connect: { id: sale.id } },
    type: TransactionType.ADDITION,
    description: 'Sale',
    amount: ownerShare,
  })
  await organizationRepository.incrementBalance(org.id, ownerShare)
  await transactionRepository.create({
    user: { connect: { id: userId } },
    unit: { connect: { id: sale.unitId } },
    session: { connect: { id: sale.sessionId! } },
    sale: { connect: { id: sale.id } },
    type: TransactionType.ADDITION,
    description: 'Sale',
    amount: ownerShare,
  })
}
