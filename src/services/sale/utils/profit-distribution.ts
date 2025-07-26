import { DistributeProfitsDeps } from '../types'

import { DetailedSale } from '@/repositories/sale-repository'
import { BarberNotFoundError } from '@/services/@errors/barber/barber-not-found-error'
import { SessionNotFoundError } from '@/services/@errors/cash-register/session-not-found-error'
import { OrganizationNotFoundError } from '@/services/@errors/organization/organization-not-found-error'
import { BarberProfileNotFoundError } from '@/services/@errors/profile/barber-profile-not-found-error'
import { IncrementBalanceProfileService } from '@/services/profile/increment-balance'
import { IncrementBalanceUnitService } from '@/services/unit/increment-balance'
import {
  BarberProduct,
  BarberService,
  Prisma,
  Transaction,
} from '@prisma/client'
import { DetailedAppointment } from '@/repositories/appointment-repository'
import { calculateBarberCommission } from './barber-commission'
import { AppointmentNotFoundError } from '@/services/@errors/appointment/appointment-not-found-error'
import { ProfileNotFoundError } from '@/services/@errors/profile/profile-not-found-error'
import { ItemNeedsServiceOrProductOrAppointmentError } from '@/services/@errors/sale/item-needs-service-or-product-error'

export async function distributeProfits(
  sale: DetailedSale,
  organizationId: string,
  userId: string,
  {
    organizationRepository,
    profileRepository,
    unitRepository,
    appointmentRepository,
    barberServiceRepository,
    barberProductRepository,
    appointmentServiceRepository,
    saleItemRepository,
  }: DistributeProfitsDeps,
  tx?: Prisma.TransactionClient,
): Promise<{ transactions: Transaction[] }> {
  const org = await organizationRepository.findById(organizationId)
  if (!org) throw new OrganizationNotFoundError()

  if (!sale.sessionId) throw new SessionNotFoundError()

  const transactions: Transaction[] = []

  const incrementUnit = new IncrementBalanceUnitService(unitRepository)
  const incrementProfile = new IncrementBalanceProfileService(profileRepository)
  type ValuesItemsTotals = {
    amount: number
    appointmentServiceId?: string
    percentage: number
  }
  const itemsTotals: Record<string, ValuesItemsTotals> = {}
  let ownerShare = 0

  for (const item of sale.items) {
    const value = item.price ?? 0

    if (!item.barberId) {
      ownerShare += value
      continue
    }

    const barberProfile = item.barber?.profile
    if (!barberProfile) throw new ProfileNotFoundError()

    if (item.appointmentId) {
      const appointment =
        (item.appointment as DetailedAppointment | undefined) ??
        (await appointmentRepository.findById(item.appointmentId))

      if (appointment) {
        const servicesAppoint = appointment.services ?? []

        for (const serviceAppoint of servicesAppoint) {
          const profileId =
            item.barber?.profile?.id ?? appointment.barber.profile?.id

          const relation = profileId
            ? await barberServiceRepository.findByProfileService(
                profileId,
                serviceAppoint.service.id,
              )
            : null

          const perc = calculateBarberCommission(
            serviceAppoint.service,
            item.barber?.profile,
            relation,
          )

          const valueBarber = (serviceAppoint.service.price * perc) / 100
          const values: ValuesItemsTotals = {
            amount: valueBarber,
            percentage: perc,
            appointmentServiceId: serviceAppoint.id,
          }
          itemsTotals[item.id] = values
          ownerShare += value - valueBarber
        }
        continue
      } else {
        throw new AppointmentNotFoundError()
      }
    }

    if (!item.serviceId && !item.productId && !item.planId) {
      throw new ItemNeedsServiceOrProductOrAppointmentError()
    }

    if (item.planId) {
      ownerShare += value
      continue
    }

    let relation: BarberService | BarberProduct | null | undefined = null

    if (item.serviceId) {
      relation = await barberServiceRepository.findByProfileService(
        barberProfile.id,
        item.serviceId,
      )
    }

    if (item.productId) {
      relation = await barberProductRepository.findByProfileProduct(
        barberProfile.id,
        item.productId,
      )
    }

    const percentageBarber = calculateBarberCommission(
      item.service ?? item.product,
      item.barber?.profile,
      relation,
    )

    const valueBarber = (value * percentageBarber) / 100
    const values: ValuesItemsTotals = {
      amount: valueBarber,
      percentage: percentageBarber,
    }
    itemsTotals[item.id] = values
    ownerShare += value - valueBarber
  }

  for (const [
    saleItemId,
    { amount, appointmentServiceId, percentage },
  ] of Object.entries(itemsTotals)) {
    const userBarber = sale.items.find((item) => item.id === saleItemId)?.barber
    if (!userBarber) throw new BarberNotFoundError()
    if (!userBarber.profile) throw new BarberProfileNotFoundError()

    if (userBarber.profile.totalBalance < 0) {
      const balanceBarber = userBarber.profile.totalBalance
      const valueCalculated = balanceBarber + amount
      const amountToPay = valueCalculated <= 0 ? amount : -balanceBarber
      const transactionUnit = await incrementUnit.execute(
        sale.unitId,
        userBarber.id,
        amountToPay,
        sale.id,
        true,
        undefined,
        tx,
      )
      transactions.push(transactionUnit.transaction)
    }
    const transactionProfile = await incrementProfile.execute(
      userBarber.id,
      amount,
      sale.id,
      userBarber.profile.totalBalance < 0,
      undefined,
      undefined,
      undefined,
      undefined,
      tx,
    )
    transactions.push(transactionProfile.transaction)
    if (appointmentServiceId) {
      await appointmentServiceRepository.update(
        appointmentServiceId,
        {
          commissionPercentage: percentage,
        },
        tx,
      )
    } else {
      await saleItemRepository.update(
        saleItemId,
        {
          porcentagemBarbeiro: percentage,
        },
        tx,
      )
    }
  }

  const transactionUnit = await incrementUnit.execute(
    sale.unitId,
    userId,
    ownerShare,
    sale.id,
    false,
    undefined,
    tx,
  )
  transactions.push(transactionUnit.transaction)

  return { transactions }
}
